import React, { useRef, useState } from 'react';
import { Button } from './Button';
import { gql } from '@apollo/client';
import { toast } from 'sonner';
import { DocumentType, File, FileOwnerType } from '@/gql/graphql';
import { getUser } from '@/utils/account-utils';
import { UPLOAD_DOCUMENT } from '@/gql/queries';
import { useHealthFlexAnalytics } from '@/services/analytics';
import { useAuth } from '@/contexts';
// Import the ButtonVariant type
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

interface FileUploadProps {
  onUploadComplete: (response: any) => void;
  onError?: (error: any) => void;
  buttonText?: string;
  buttonVariant?: ButtonVariant;
  accept?: string;
  className?: string;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  type?: 'button' | 'submit' | 'reset';
  file?: File;
  ownerType?: FileOwnerType;
  documentType?: DocumentType;
}

/**
 * A reusable component for file uploads
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  onUploadComplete,
  onError,
  buttonText = 'Upload File',
  buttonVariant = 'primary',
  accept = '*',
  className = '',
  showToast = true,
  successMessage = 'File uploaded successfully',
  errorMessage = 'Failed to upload file',
  type = 'button',
  ownerType = FileOwnerType.User,
  documentType = DocumentType.PatientUpload
}) => {
  const analytics = useHealthFlexAnalytics();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      // Create a FormData object
      const formData = new FormData();
      const user = getUser();
      
      // Create the operations JSON
      const operations = {
        query: UPLOAD_DOCUMENT.loc?.source.body || '',
        variables: {
          input: {
            file: null,
            ownerId: user?._id,
            ownerType: FileOwnerType.User,
            documentType: DocumentType.PatientUpload
          }
        }
      };
      
      // Add the operations to the FormData FIRST
      formData.append('operations', JSON.stringify(operations));
      
      // Add the map to the FormData SECOND
      formData.append('map', JSON.stringify({ '0': ['variables.input.file'] }));
      
      // Add the file to the FormData LAST
      formData.append('0', file);
      
      // Make the fetch request
      const response = await fetch(
        process.env.NEXT_PUBLIC_GRAPHQL_API_URL || 'https://devapi.stance.health/graphql',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-center-id': localStorage.getItem('stance-centreID') || '',
            'x-organization-id': localStorage.getItem('stance-organizationID') || '',
          },
          body: formData
        }
      );
      
      const result = await response.json();
      
      if (result.data) {
        // Track file upload success
        const uploadedFile = result.data.uploadFile;
        if (uploadedFile) {
          const uploadType = documentType === DocumentType.PatientUpload ? 'general' : "OTHER"
                          
          
          analytics.trackFileUpload(
            uploadedFile.url || 'unknown',
            uploadType as 'first_assessment' | 'timeline' | 'general',
            file.name,
            file.size,
            ownerType === FileOwnerType.User ? user?._id : undefined,
            user?._id
          );
        }
        
        // Show success toast if enabled
        if (showToast) {
          toast.success(successMessage);
        }
        onUploadComplete(result);
      } else {
        console.error('Upload failed:', result);
        // Show error toast if enabled
        if (showToast) {
          toast.error(`${errorMessage}: ${result.errors?.[0]?.message || 'Unknown error'}`);
        }
        if (onError) {
          onError(result);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Show error toast if enabled
      if (showToast) {
        toast.error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      if (onError) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept={accept} 
        className="hidden" 
      />
      <Button 
        variant={buttonVariant} 
        onClick={handleButtonClick}
        disabled={isUploading}
        className={className}
        type={type}
      >
        {isUploading ? 'Uploading...' : buttonText}
      </Button>
    </div>
  );
}; 