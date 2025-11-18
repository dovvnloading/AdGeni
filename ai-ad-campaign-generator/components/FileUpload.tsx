/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React, { useCallback } from 'react';
import { UploadedFile } from '../types';


interface FileUploadProps {
    onFileSelect: (file: UploadedFile) => void;
    uploadedFilePreview?: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, uploadedFilePreview }) => {
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const previewUrl = URL.createObjectURL(file);
            const base64 = (reader.result as string).split(',')[1];
            onFileSelect({ file, previewUrl, base64 });
        };
        reader.readAsDataURL(file);
    };
    
    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            processFile(event.dataTransfer.files[0]);
            event.dataTransfer.clearData();
        }
    }, []);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };


    return (
        <div 
            className="w-full p-4 bg-gray-200 rounded-xl text-center cursor-pointer transition-shadow
                       shadow-[inset_5px_5px_10px_#c7c7c7,inset_-5px_-5px_10px_#f9f9f9] 
                       hover:shadow-[inset_3px_3px_6px_#c7c7c7,inset_-3px_-3px_6px_#f9f9f9]"
            onClick={() => document.getElementById('file-input')?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <input
                id="file-input"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
            {uploadedFilePreview ? (
                <img src={uploadedFilePreview} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                    <span className="text-2xl font-bold">↑</span>
                    <p className="text-sm">
                        <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs">PNG, JPG, etc.</p>
                </div>
            )}
        </div>
    );
};

export default FileUpload;