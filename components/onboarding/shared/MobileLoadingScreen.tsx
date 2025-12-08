import React from 'react';
import dynamic from 'next/dynamic';
import Spinner from '@/components/ui/Spinner';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface MobileLoadingScreenProps {
  message?: string;
  animationData?: string;
}

export default function MobileLoadingScreen({ 
  message = 'Loading...', 
  animationData = '/lottie1.json' 
}: MobileLoadingScreenProps) {
  const [lottieData, setLottieData] = React.useState(null);
  const [showFallback, setShowFallback] = React.useState(false);

  React.useEffect(() => {
    // Load Lottie animation data
    fetch(animationData)
      .then(response => response.json())
      .then(data => setLottieData(data))
      .catch(() => setShowFallback(true));
  }, [animationData]);

  return (
    <div className="h-full bg-gray-50 flex flex-col items-center justify-center p-8">
      {/* Warning Banner - Only for Payment Processing */}
      {message.includes('Payment') && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b-2 border-yellow-400 px-4 py-3 shadow-md">
          <div className="flex items-center justify-center gap-2">
            
            <span className="text-sm font-semibold text-yellow-800">
              Please do not close or refresh this page while your payment is processing.
            </span>
          </div>
        </div>
      )}

      <div className="text-center">
        {lottieData && !showFallback ? (
          <div className="w-90 h-90 mx-auto mb-6">
            <Lottie
              animationData={lottieData}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
            <div className="flex items-center justify-center mb-6">
            <Spinner size="lg" />
          </div>
          </div>

        ) : (
          // <div className="flex items-center justify-center mb-6">
          //   <Spinner size="lg" />
          // </div>
          <></>
        )}
        <p className="text-lg font-medium text-gray-900 mb-2">{message}</p>
        <p className="text-sm text-gray-600">
          {message.includes('Payment')
            ? "Please don't refresh or close the page during payment"
            : "Please don't close the window..."
          }
        </p>
      </div>
    </div>
  );
}
