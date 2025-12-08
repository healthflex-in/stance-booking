import {toast} from 'sonner'
import Image from 'next/image'
import React, {useState, useRef, useEffect} from 'react'
import {Card, CardHeader, CardContent} from '@/components/ui-atoms/Card'
import {ClinicalRecord, FileOwnerType, DocumentType} from '@/gql/graphql'
import {UPLOAD_DOCUMENT} from '@/gql/queries'
import {getUser} from '@/utils/account-utils'
import {Modal} from '@/components/ui-atoms/Modal'
import {themePicker} from '@/utils/standard-utils'
import {Button} from '@/components/ui-atoms/Button'
import {ArrowUturnLeftIcon, ArrowUturnRightIcon} from '@heroicons/react/24/outline'
import {
    PencilIcon,
    EyeDropperIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'

interface BodyChartSectionProps {
    value?: ClinicalRecord
    onChange?: (value: ClinicalRecord) => void
    isCollapsed?: boolean
    onToggle?: () => void
}

const defaultBodyChart: ClinicalRecord = {
    bodyChart: 'https://stance-health-demo.vercel.app/body_chart.png',
}

export const BodyChartSection: React.FC<BodyChartSectionProps> = ({
                                                                      value = defaultBodyChart,
                                                                      onChange,
                                                                      isCollapsed = false,
                                                                      onToggle,
                                                                  }) => {
    const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedColor, setSelectedColor] = useState('#FF0000')
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [brushSize, setBrushSize] = useState(5)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [lastX, setLastX] = useState(0)
    const [lastY, setLastY] = useState(0)
    const [isUploading, setIsUploading] = useState(false)

    // Undo/Redo state
    const [history, setHistory] = useState<ImageData[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)

    const standardColors = [
        '#FF0000', // Red
        '#0000FF', // Blue
        '#00FF00', // Green
        '#FFFF00', // Yellow
        '#000000', // Black
    ]

    const handleChange = (newValue: ClinicalRecord) => {
        onChange?.(newValue)
    }

    const handleGenderChange = (newGender: 'MALE' | 'FEMALE') => {
        setGender(newGender)
        handleChange({
            ...value,
            bodyChart:
                newGender === 'MALE'
                    ? 'https://stance-health-demo.vercel.app/body_chart.png'
                    : 'https://stance-health-demo.vercel.app/women_body_chart.png',
        })
    }

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (historyIndex < history.length - 1) {
            setHistory(history.slice(0, historyIndex + 1));
        }
        setHistory((prevHistory) => [...prevHistory, currentState]);
        setHistoryIndex((prevIndex) => prevIndex + 1);
    };

    // Undo function
    const handleUndo = () => {
        if (historyIndex <= 0) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Go back one step in history
        setHistoryIndex(prevIndex => prevIndex - 1)
        ctx.putImageData(history[historyIndex - 1], 0, 0)
    }

    // Redo function
    const handleRedo = () => {
        if (historyIndex >= history.length - 1) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Go forward one step in history
        setHistoryIndex(prevIndex => prevIndex + 1)
        ctx.putImageData(history[historyIndex + 1], 0, 0)
    }

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY

        setIsDrawing(true)
        setLastX(x)
        setLastY(y)
    }

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY

        ctx.beginPath()
        ctx.moveTo(lastX, lastY)
        ctx.lineTo(x, y)
        ctx.strokeStyle = selectedColor
        ctx.lineWidth = brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()

        setLastX(x)
        setLastY(y)
    }

    const handleCanvasMouseUp = () => {
        if (isDrawing) {
            saveToHistory()
        }
        setIsDrawing(false)
    }

    const handleCanvasMouseLeave = () => {
        if (isDrawing) {
            saveToHistory()
        }
        setIsDrawing(false)
    }

    const [isLoadingImage, setIsLoadingImage] = useState(false);

    useEffect(() => {
        if (!isModalOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match the container
        const container = canvas.parentElement;
        if (!container) return;

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsLoadingImage(true);

        const defaultPath = gender === 'MALE' ? '/body_chart.png' : '/women_body_chart.png';
        const img = new window.Image();

        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const imgRatio = img.width / img.height;
            const canvasRatio = canvas.width / canvas.height;

            let w, h, x, y;

            if (imgRatio > canvasRatio) {
                w = canvas.width;
                h = w / imgRatio;
                x = 0;
                y = (canvas.height - h) / 2;
            } else {
                h = canvas.height;
                w = h * imgRatio;
                x = (canvas.width - w) / 2;
                y = 0;
            }

            ctx.drawImage(img, x, y, w, h);

            const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([initialState]);
            setHistoryIndex(0);

            setIsLoadingImage(false);
        };

        img.onerror = () => {
            console.error("Failed to load even the default image");
            setIsLoadingImage(false);
        };

        img.src = defaultPath;

        const timeout = setTimeout(() => {
            if (isLoadingImage) {
                setIsLoadingImage(false);
            }
        }, 3000);

        return () => {
            clearTimeout(timeout);
            img.onload = null;
            img.onerror = null;
        };
    }, [isModalOpen, gender]);

    const handleSave = async () => {
        const canvas = canvasRef.current
        if (!canvas) return
        setIsUploading(true)
        try {
            canvas.toBlob(async (blob) => {
                if (!blob) return
                const file = new window.File([blob], 'body_chart.png', {
                    type: 'image/png',
                })
                const token = localStorage.getItem('token')
                const formData = new FormData()
                const user = getUser()
                const operations = {
                    query: UPLOAD_DOCUMENT.loc?.source.body || '',
                    variables: {
                        input: {
                            file: null,
                            ownerId: user?._id,
                            ownerType: FileOwnerType.User,
                            documentType: DocumentType.BodyChart,
                        },
                    },
                }
                formData.append('operations', JSON.stringify(operations))
                formData.append(
                    'map',
                    JSON.stringify({'0': ['variables.input.file']}),
                )
                formData.append('0', file)
                const response = await fetch(
                    process.env.NEXT_PUBLIC_GRAPHQL_API_URL ||
                    'https://devapi.stance.health/graphql',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'x-organization-id':
                                localStorage.getItem('stance-organizationID') || '',
                            'x-center-id': localStorage.getItem('stance-centreID') || '',
                        },
                        body: formData,
                    },
                )
                const result = await response.json()
                if (result?.data?.uploadFile?.url) {
                    toast.success('Body chart saved!', result)
                    setIsModalOpen(false)
                    onChange?.({...value, bodyChart: result.data.uploadFile.url})
                } else {
                    toast.error(
                        `Failed to save: ${result?.errors?.[0]?.message || 'Unknown error'}`,
                    )
                }
                setIsUploading(false)
            }, 'image/png')
        } catch (error) {
            toast.error('Error saving body chart')
            setIsUploading(false)
        }
    }

    return (
        <>
            <Card className="overflow-hidden">
                <CardHeader
                    className="bg-gray-50"
                    isCollapsed={isCollapsed}
                    onToggle={onToggle}
                >
                    <h2 className="text-lg font-semibold">Body Chart</h2>
                </CardHeader>
                <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                    <div className="flex justify-center space-x-4 mb-4">
                        <button
                            className={`px-4 py-2 rounded ${gender === 'MALE' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
                            onClick={() => handleGenderChange('MALE')}
                        >
                            Male
                        </button>
                        <button
                            className={`px-4 py-2 rounded ${gender === 'FEMALE' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
                            onClick={() => handleGenderChange('FEMALE')}
                        >
                            Female
                        </button>
                    </div>
                    <div className="relative aspect-[4/3] bg-white rounded-lg border border-gray-200 group">
                        <Image
                            src={value.bodyChart || '/body_chart.png'}
                            alt="Body Chart"
                            className="w-full h-full object-contain"
                            width={800}
                            height={600}
                            priority
                        />
                        <div
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                            onClick={() => {
                                setIsModalOpen(true)
                            }}
                        >
                            <PencilIcon className="w-8 h-8 text-white"/>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                header={
                    <div className="flex items-center justify-between p-4">
                        <h3 className="text-lg font-semibold">Edit Body Chart</h3>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="p-1 rounded-full hover:bg-gray-200"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-500"/>
                        </button>
                    </div>
                }
                footer={
                    <div className="flex items-center space-x-4 p-4 justify-between">
                        <div className="flex flex-1 items-center space-x-2">
                            <Button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUndo();
                                }}
                                disabled={historyIndex <= 0}
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-1"
                                title="Undo"
                            >
                                <ArrowUturnLeftIcon className="w-4 h-4"/> <span>Undo</span>
                            </Button>
                            <Button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRedo();
                                }}
                                disabled={historyIndex >= history.length - 1}
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-1"
                                title="Redo"
                            >
                                <ArrowUturnRightIcon className="w-4 h-4"/> <span>Redo</span>
                            </Button>
                            <span className="mx-2">|</span>
                            <label>Brush Size:</label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-24"
                            />
                        </div>
                        <div className="flex flex-1 items-center space-x-2 float-center justify-center">
                            <label>Colors:</label>
                            <div className="flex items-center space-x-1">
                                {standardColors.map((color) => (
                                    <button
                                        type="button"
                                        key={color}
                                        className={`w-6 h-6 rounded-full border-2 ${
                                            selectedColor === color
                                                ? 'border-primary'
                                                : 'border-transparent'
                                        }`}
                                        style={{backgroundColor: color}}
                                        onClick={() => {
                                            setSelectedColor(color)
                                        }}
                                    />
                                ))}
                                <label
                                    className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                        !standardColors.includes(selectedColor)
                                            ? 'border-primary'
                                            : 'border-transparent'
                                    } hover:brightness-90`}
                                >
                                    <input
                                        type="color"
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        style={{border: 'none', padding: 0}}
                                    />
                                    <span
                                        className="absolute w-7 h-7 rounded-full"
                                        style={{
                                            backgroundColor: selectedColor,
                                            border: '1px solid #e5e7eb',
                                        }}
                                    />
                                    <EyeDropperIcon
                                        className="relative w-5 h-5 z-10 pointer-events-none"
                                        style={{
                                            color:
                                                themePicker(selectedColor) === 'DARK' ? '#fff' : '#222',
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={isUploading}
                                className="float-right"
                                variant="default"
                            >
                                {isUploading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="relative w-full h-[600px]">
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full border rounded-lg"
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseLeave}
                    />
                </div>
            </Modal>
        </>
    )
}
