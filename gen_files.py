import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

base_path = r'C:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main\src\pages'

create_file(os.path.join(base_path, 'CourierOnboarding.jsx'), '''import React from "react";
export default function CourierOnboarding() {
  return <div className="p-4" dir="rtl"><h2>بوابة تسجيل المندوبين</h2><p>هنا يمكنك الانضمام للعمل كمندوب توصيل مع واصل.</p></div>;
}''')

create_file(os.path.join(base_path, 'TermsAndConditions.jsx'), '''import React from "react";
export default function TermsAndConditions() {
  return <div className="p-4" dir="rtl"><h2>الشروط والأحكام</h2><p>للمندوبين والمدراء</p></div>;
}''')

create_file(os.path.join(base_path, 'ReferralLink.jsx'), '''import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
export default function ReferralLink() {
  const { referralId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.setItem("wasel_referral_id", referralId);
    navigate("/?login=true");
  }, []);
  return <div>جاري توجيهك...</div>;
}''')

create_file(r'C:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main\src\services\NotificationService.js', '''export const sendNotification = async (userId, message) => {
  console.log("Notification sent to", userId, message);
};
''')

