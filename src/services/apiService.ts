// API service for file upload and bucket management
const API_BASE_URL = 'https://echoai-upload-download-service-851671754708.asia-south1.run.app';

export interface UploadResponse {
  file_id: string;
  file_name: string;
  message: string;
}

export interface StatusResponse {
  status: 'processing' | 'completed' | 'failed';
  processed_file_name?: string;
  error_message?: string;
}

export interface DownloadResponse {
  download_url: string;
}

export interface BucketFile {
  name: string;
  size: number;
  updated: string;
  contentType: string;
}

// Upload file to processing service
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Upload failed');
  }

  return response.json();
};

// Check processing status
export const checkStatus = async (fileName: string): Promise<StatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/status/${encodeURIComponent(fileName)}`);
  
  if (!response.ok) {
    throw new Error('Failed to check status');
  }

  return response.json();
};

// Get download URL for processed file
export const getDownloadUrl = async (processedFileName: string): Promise<DownloadResponse> => {
  const response = await fetch(`${API_BASE_URL}/download/${encodeURIComponent(processedFileName)}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to get download URL');
  }

  return response.json();
};

// List files from bucket (mock implementation - you may need to implement actual GCP bucket listing)
export const listBucketFiles = async (bucketName: 'echo-ai-uploads' | 'echo-ai-processed'): Promise<BucketFile[]> => {
  // This would typically call a backend API to list bucket contents
  // For now, return mock data - you'll need to implement the actual bucket listing API
  try {
    const response = await fetch(`${API_BASE_URL}/list-bucket/${bucketName}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch bucket contents');
    }
    
    return response.json();
  } catch (error) {
    console.warn('Bucket listing not implemented, returning empty array');
    return [];
  }
};

// Download file directly from bucket
export const downloadFromBucket = async (bucketName: string, fileName: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/bucket-download/${bucketName}/${encodeURIComponent(fileName)}`);
  
  if (!response.ok) {
    throw new Error('Failed to download file from bucket');
  }

  return response.blob();
};