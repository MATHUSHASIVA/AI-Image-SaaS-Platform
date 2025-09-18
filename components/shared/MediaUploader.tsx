"use client";

import { useToast } from "@/components/ui/use-toast"
import { dataUrl, getImageSize } from "@/lib/utils";
import { CldImage, CldUploadWidget } from "next-cloudinary"
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { useState } from "react";

type MediaUploaderProps = {
  onValueChange: (value: string) => void;
  setImage: React.Dispatch<any>;
  publicId: string;
  image: any;
  type: string;
}

const MediaUploader = ({
  onValueChange,
  setImage,
  image,
  publicId,
  type
}: MediaUploaderProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Retry function for handling rate limits
  const retryUpload = async (uploadFn: () => void, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await uploadFn();
        return;
      } catch (error: any) {
        if (error.http_code === 420 || error.message?.includes('420') || error.message?.includes('Enhance Your Calm')) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Upload rate limited. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max upload retries exceeded');
  };

  const onUploadSuccessHandler = (result: any) => {
    setImage((prevState: any) => ({
      ...prevState,
      publicId: result?.info?.public_id,
      width: result?.info?.width,
      height: result?.info?.height,
      secureURL: result?.info?.secure_url
    }))

    onValueChange(result?.info?.public_id)

    toast({
      title: 'Image uploaded successfully',
      description: '1 credit was deducted from your account',
      duration: 5000,
      className: 'success-toast' 
    })

    setIsUploading(false);
  }

  const onUploadErrorHandler = (error: any) => {
    console.error('Upload error:', error);
    
    // Check if it's a rate limit error
    if (error?.http_code === 420 || error?.message?.includes('420') || error?.message?.includes('Enhance Your Calm')) {
      toast({
        title: 'Upload rate limited',
        description: 'Too many uploads. Please wait a moment and try again.',
        duration: 5000,
        className: 'error-toast' 
      });
    } else {
      toast({
        title: 'Something went wrong while uploading',
        description: 'Please try again',
        duration: 5000,
        className: 'error-toast' 
      });
    }

    setIsUploading(false);
  }

  const handleUploadClick = (open: any) => {
    if (isUploading) {
      toast({
        title: 'Upload in progress',
        description: 'Please wait for the current upload to complete',
        duration: 3000,
        className: 'error-toast'
      });
      return;
    }

    // Add a small delay to prevent rapid clicks
    setIsUploading(true);
    setTimeout(() => {
      if (open && typeof open === 'function') {
        open();
      }
    }, 100);
  };

  return (
    <CldUploadWidget
      uploadPreset="jsm_imaginify"
      options={{
        multiple: false,
        resourceType: "image",
        maxFileSize: 10000000, // 10MB limit
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
      }}
      onSuccess={onUploadSuccessHandler}
      onError={onUploadErrorHandler}
      onOpen={() => setIsUploading(true)}
      onClose={() => setIsUploading(false)}
    >
      {({ open }) => (
        <div className="flex flex-col gap-4">
          <h3 className="h3-bold text-dark-600">
            Original
          </h3>

          {publicId ? (
            <>
              <div className="cursor-pointer overflow-hidden rounded-[10px]">
                <CldImage 
                  width={getImageSize(type, image, "width")}
                  height={getImageSize(type, image, "height")}
                  src={publicId}
                  alt="image"
                  sizes={"(max-width: 767px) 100vw, 50vw"}
                  placeholder={dataUrl as PlaceholderValue}
                  className="media-uploader_cldImage"
                />
              </div>
            </>
          ): (
            <div 
              className={`media-uploader_cta ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
              onClick={() => handleUploadClick(open)}
            >
              <div className="media-uploader_cta-image">
                <Image 
                  src="/assets/icons/add.svg"
                  alt="Add Image"
                  width={24}
                  height={24}
                />
              </div>
              <p className="p-14-medium">
                {isUploading ? 'Uploading...' : 'Click here to upload image'}
              </p>
            </div>
          )}
        </div>
      )}
    </CldUploadWidget>
  )
}

export default MediaUploader