import { useState, useRef } from 'react';

export const useMediaHandler = () => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setVoiceFile(file);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const clearVoice = () => {
    setVoiceFile(null);
  };

  const clearAll = () => {
    clearPhoto();
    clearVoice();
  };

  return {
    photoFile,
    voiceFile,
    photoPreview,
    photoInputRef,
    voiceInputRef,
    handlePhotoChange,
    handleVoiceChange,
    clearPhoto,
    clearVoice,
    clearAll,
  };
};
