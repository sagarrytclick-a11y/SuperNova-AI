'use client';

import Link from 'next/link';
import { Check, Sparkles, ArrowLeft } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Get started with basic AI features',
      features: [
        '10 messages per day',
        'Basic health insights',
        'Chat history (7 days)',
        'Community support',
      ],
      cta: 'Current Plan',
      highlighted: false,
      disabled: true,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'Unlock the full power of SuperNova',
      features: [
        'Unlimited messages',
        'Advanced health analysis',
        'Unlimited chat history',
        'Priority support',
        'Custom health plans',
        'Export conversations',
      ],
      cta: 'Upgrade to Pro',
      highlighted: true,
      disabled: false,
    },
    {
      name: 'Enterprise',
      price: '$49',
      period: '/month',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
        'SSO & advanced security',
        'Usage analytics dashboard',
      ],
      cta: 'Contact Sales',
      highlighted: false,
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#131314] text-[#e3e3e3]">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#c4c7c5] hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back to chat
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto px-4 pb-12">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles size={14} />
          Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 ">
          Choose your plan
        </h1>
        <p className="text-lg text-[#c4c7c5]">
          Unlock the full potential of your AI health assistant
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${plan.highlighted
                  ? 'bg-gradient-to-b from-blue-600/20 to-purple-600/10 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'bg-[#1e1f20] border border-[#444746]'
                }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#e3e3e3] mb-1">{plan.name}</h3>
                <p className="text-sm text-[#8e918f]">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-[#e3e3e3]">{plan.price}</span>
                <span className="text-[#8e918f]">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                    <span className="text-[#c4c7c5]">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.disabled}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : plan.disabled
                      ? 'bg-[#282a2c] text-[#8e918f] cursor-not-allowed'
                      : 'bg-[#282a2c] hover:bg-[#333537] text-[#e3e3e3]'
                  }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
