import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
export default function ReferralLink() {
  const { referralId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.setItem("wasel_referral_id", referralId);
    navigate("/?login=true");
  }, []);
  return <div>جاري توجيهك...</div>;
}