import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
    onCancel: () => void;
    onSave: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
    image,
    onCropComplete,
    onCancel,
    onSave
}) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    const handleCropComplete = useCallback(
        (croppedArea: Area, croppedAreaPixels: Area) => {
            onCropComplete(croppedArea, croppedAreaPixels);
        },
        [onCropComplete]
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-2xl w-full m-4">
                <div className="relative h-96 mb-4">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={handleCropComplete}
                    />
                </div>

                <div className="flex items-center justify-center mb-4">
                    <label className="text-sm text-gray-600 ml-2">זום:</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-1/2"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        ביטול
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        שמור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;