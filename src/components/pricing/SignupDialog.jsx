import React, { useState } from "react";
import { X } from "lucide-react";

export default function SignupDialog({ plan, onClose, onSubmit }) {
  const [companyName, setCompanyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isFree = plan.price === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ companyName, ownerEmail, ownerPassword });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-4 end-4 text-[#3a2f22]/40 hover:text-[#3a2f22]">
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-heading text-xl text-[#3a2f22] mb-1">{plan.name} Plan</h3>
        <p className="text-sm text-[#3a2f22]/55 font-body mb-5">
          {isFree ? "Create your free account to get started." : "Enter your details to continue to checkout."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold"
          />
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold"
          />
          {isFree && (
            <input
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2.5 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold"
            />
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Please wait..." : isFree ? "Create Account" : "Continue to Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}