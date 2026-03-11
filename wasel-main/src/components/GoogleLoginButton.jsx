import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export const GoogleLoginButton = () => {
  const handleLogin = () => {
    if (base44?.auth?.redirectToLogin) {
      base44.auth.redirectToLogin(window?.location?.href || '/');
    } else {
      console.error('Base44 auth is not available');
    }
  };

  return (
    <div className="flex justify-center">
      <Button onClick={handleLogin} className="bg-white text-[#1B4332] hover:bg-gray-100">
        تسجيل الدخول عبر Base44
      </Button>
    </div>
  );
};

export default GoogleLoginButton;
