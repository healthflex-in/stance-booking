import React from 'react';
import { FileIcon } from 'lucide-react';
import { Input } from '@/components/ui-atoms/Input';
import { Button } from '@/components/ui-atoms/Button';
import { FileUpload } from '@/components/ui-atoms/FileUpload';
import { Card, CardHeader, CardContent } from '@/components/ui-atoms/Card';

interface Document {
    documentName: string;
    details: string;
    document: string;
}

interface DocumentSectionProps {
    value?: { documents: Document[] };
    onChange?: (value: { documents: Document[] }) => void;
    isCollapsed?: boolean;
    onToggle?: () => void;
    onPdfUpload?: () => void;
}

const defaultDocument: Document = {
    documentName: '',
    details: '',
    document: ''
};

export const DocumentSection: React.FC<DocumentSectionProps> = ({
                                                                    value = { documents: [] },
                                                                    onChange,
                                                                    isCollapsed = false,
                                                                    onToggle,
                                                                    onPdfUpload,
                                                                }) => {
    const [documents, setDocuments] = React.useState(() => {
        if (value.documents?.length > 0) {
            return value.documents.map(doc => ({
                documentName: doc?.documentName ?? '',
                details: doc?.details ?? '',
                document: doc?.document ?? '',
            }));
        }
        return [{ ...defaultDocument }];
    });

    React.useEffect(() => {
        if (value.documents?.length > 0) {
            setDocuments(value.documents.map(doc => ({
                documentName: doc?.documentName ?? '',
                details: doc?.details ?? '',
                document: doc?.document ?? '',
            })));
        }
    }, [value]);

    const updateDocuments = (newDocuments: typeof documents) => {
        const documentsCopy = newDocuments.map(doc => ({
            ...doc,
        }));
        setDocuments(documentsCopy);

        // Convert to proper format before sending to parent
        onChange?.({
            documents: documentsCopy.map(doc => ({
                documentName: doc.documentName,
                details: doc.details,
                document: doc.document
            }))
        });
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="bg-gray-50"
                isCollapsed={isCollapsed}
                onToggle={onToggle}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Documents</h2>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling to header
                            updateDocuments([...documents, { ...defaultDocument }]);
                        }}
                    >
                        Add New
                    </Button>
                </div>
            </CardHeader>
            <CardContent isCollapsed={isCollapsed} className="px-4 py-3">
                {documents.map((doc, index) => (
                    <div key={index} className="mb-4 relative border rounded-lg p-4">
                        <div className="space-y-3">
                            <Input
                                label="Document Name"
                                value={doc.documentName}
                                onChange={(e) => {
                                    const newDocuments = [...documents];
                                    newDocuments[index] = { ...newDocuments[index], documentName: e.target.value };
                                    updateDocuments(newDocuments);
                                }}
                            />
                            <Input
                                label="Details"
                                multiline={true}
                                className="min-h-[80px]"
                                value={doc.details}
                                onChange={(e) => {
                                    const newDocuments = [...documents];
                                    newDocuments[index] = { ...newDocuments[index], details: e.target.value };
                                    updateDocuments(newDocuments);
                                }}
                            />
                            <div className="flex items-center space-x-2">
                                {doc.document ? (
                                    <div className="flex items-center space-x-2">
                                        <FileIcon className="h-4 w-4 text-blue-500" />
                                        <a
                                            href={doc.document}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-500 hover:underline"
                                        >
                                            View Document
                                        </a>
                                    </div>
                                ) : (
                                    <FileUpload
                                        onUploadComplete={(response) => {
                                            const potentialUrl = response.data?.uploadFile?.url;
                                            if (typeof potentialUrl === 'string' && potentialUrl.trim() !== '') {
                                                const documentUrl = potentialUrl.replace('/home/ubuntu/', 'https://');
                                                const newDocuments = [...documents];
                                                newDocuments[index] = { ...newDocuments[index], document: documentUrl };
                                                updateDocuments(newDocuments);
                                                
                                                // Trigger AI processing if PDF is uploaded
                                                if (potentialUrl.toLowerCase().endsWith('.pdf') && onPdfUpload) {
                                                    onPdfUpload();
                                                }
                                            } else {
                                                // If URL is not a valid string, or is empty, treat as no document.
                                                // This prevents setting 'document' to an empty object {}.
                                                if (potentialUrl && typeof potentialUrl !== 'string') {
                                                    console.warn('Received non-string URL from upload, defaulting to empty string. Value:', potentialUrl);
                                                }
                                                const newDocuments = [...documents];
                                                newDocuments[index] = { ...newDocuments[index], document: '' };
                                                updateDocuments(newDocuments);
                                            }
                                        }}
                                        onError={(error) => {
                                            console.error('Error uploading document:', error);
                                            const newDocuments = [...documents];
                                            newDocuments[index] = { ...newDocuments[index], document: '' };
                                            updateDocuments(newDocuments);
                                        }}
                                        buttonText="Upload Document"
                                        successMessage="Document uploaded successfully!"
                                        accept="application/pdf,image/*"
                                    />
                                )}
                            </div>
                        </div>

                        {documents.length > 1 && (
                            <Button
                                variant="ghost"
                                size="xs"
                                type="button"
                                className="absolute -top-2 -right-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    const newDocuments = documents.filter((_, i) => i !== index);
                                    updateDocuments(newDocuments);
                                }}
                            >
                                ✕
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};