"use client";

const pricingPlans = [
  {
    name: "Free Explorer",
    hieroglyph: "𓂀",
    price: "0 SOL",
    period: "Forever",
    description: "Begin your journey into AI-enhanced conversations",
    features: [
      "Basic chat with AI models",
      "5 messages per day",
      "No document uploads",
      "24-hour chat history",
      "Community support",
    ],
    limitations: [
      "Limited daily usage",
      "Basic model access only",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Monthly Mystic",
    hieroglyph: "𓊪",
    price: "0.15 SOL",
    period: "per month",
    description: "Perfect for regular AI conversations and document insights",
    features: [
      "Unlimited AI chat",
      "All AI models (Claude, GPT-4o, DeepSeek, Groq)",
      "Document upload & RAG",
      "Full persistent history",
      "Priority support",
      "Export & share conversations",
      "Referral rewards",
    ],
    cta: "Choose Monthly",
    highlighted: true,
    popular: true,
  },
  {
    name: "Yearly Oracle",
    hieroglyph: "𓋹",
    price: "1.5 SOL",
    period: "per year",
    description: "Best value for power users and professionals",
    features: [
      "Everything in Monthly Mystic",
      "Save 17% vs monthly",
      "Priority model access",
      "Advanced export options",
      "Early feature access",
      "Premium support",
      "Bonus referral multiplier",
    ],
    savings: "Save 0.3 SOL yearly",
    cta: "Choose Yearly",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center space-x-3">
            <span className="text-4xl">𓍯</span>
            <h2 
              className="text-4xl md:text-5xl font-bold font-heading"
              style={{
                background: `linear-gradient(
                  135deg,
                  #FFD700 0%,
                  #B48751 50%,
                  #FFD700 100%
                )`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
              }}
            >
              Sacred Offerings
            </h2>
            <span className="text-4xl">𓍯</span>
          </div>
          <p className="text-xl text-amber-200/80 max-w-2xl mx-auto">
            Choose your path to AI enlightenment. All payments secured by Solana smart contracts.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-lg transition-all duration-300 hover:scale-105 ${
                plan.highlighted ? 'transform scale-105' : ''
              }`}
              style={{
                background: plan.highlighted
                  ? `linear-gradient(
                      135deg,
                      rgba(20, 241, 149, 0.1) 0%,
                      rgba(180, 135, 90, 0.1) 100%
                    )`
                  : `linear-gradient(
                      135deg,
                      rgba(180, 135, 90, 0.08) 0%,
                      rgba(180, 135, 90, 0.04) 100%
                    )`,
                border: plan.highlighted
                  ? '2px solid rgba(20, 241, 149, 0.3)'
                  : '1px solid rgba(180, 135, 90, 0.2)',
                boxShadow: plan.highlighted
                  ? `
                      0 10px 40px rgba(20, 241, 149, 0.2),
                      inset 0 1px 0 rgba(20, 241, 149, 0.1)
                    `
                  : `
                      0 4px 20px rgba(0, 0, 0, 0.2),
                      inset 0 1px 0 rgba(255, 215, 0, 0.1)
                    `,
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span 
                    className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #14F195 0%, #00D2FF 100%)',
                      color: '#0E0E10',
                      boxShadow: '0 4px 15px rgba(20, 241, 149, 0.4)',
                    }}
                  >
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Icon */}
              <div className="text-center mb-6">
                <div 
                  className="text-6xl mb-2"
                  style={{
                    color: plan.highlighted ? '#14F195' : '#FFD700',
                    textShadow: `
                      0 0 20px ${plan.highlighted ? 'rgba(20, 241, 149, 0.5)' : 'rgba(255, 215, 0, 0.5)'},
                      0 0 40px ${plan.highlighted ? 'rgba(20, 241, 149, 0.3)' : 'rgba(255, 215, 0, 0.3)'}
                    `,
                  }}
                >
                  {plan.hieroglyph}
                </div>
                <h3 className="text-2xl font-bold text-amber-100 font-heading">
                  {plan.name}
                </h3>
              </div>

              {/* Pricing */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center">
                  <span 
                    className="text-4xl font-bold"
                    style={{
                      color: plan.highlighted ? '#14F195' : '#FFD700',
                      textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
                    }}
                  >
                    {plan.price}
                  </span>
                </div>
                <p className="text-amber-200/60 mt-1">{plan.period}</p>
                {plan.savings && (
                  <p className="text-[#14F195] text-sm font-medium mt-2">
                    {plan.savings}
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-amber-200/80 text-center mb-6 leading-relaxed">
                {plan.description}
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <div 
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: plan.highlighted
                          ? 'rgba(20, 241, 149, 0.2)'
                          : 'rgba(255, 215, 0, 0.2)',
                      }}
                    >
                      <svg 
                        className="w-3 h-3" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        style={{ color: plan.highlighted ? '#14F195' : '#FFD700' }}
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-amber-200/90 text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations?.map((limitation, limitIndex) => (
                  <div key={limitIndex} className="flex items-center space-x-3">
                    <div 
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255, 95, 86, 0.2)' }}
                    >
                      <svg 
                        className="w-3 h-3" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        style={{ color: '#FF5F56' }}
                      >
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-amber-200/60 text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
                style={{
                  background: plan.highlighted
                    ? 'linear-gradient(135deg, #14F195 0%, #00D2FF 100%)'
                    : 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(180, 135, 90, 0.1) 100%)',
                  color: plan.highlighted ? '#0E0E10' : '#FFD700',
                  border: plan.highlighted ? 'none' : '2px solid rgba(255, 215, 0, 0.3)',
                  boxShadow: plan.highlighted
                    ? '0 8px 25px rgba(20, 241, 149, 0.3)'
                    : '0 4px 15px rgba(255, 215, 0, 0.2)',
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-amber-200/60">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secured by Solana smart contracts</span>
          </div>
          
          <p className="text-amber-200/60 text-sm max-w-2xl mx-auto">
            All subscriptions include grace periods and can be cancelled anytime. 
            Your data remains yours forever, tied to your wallet signature.
          </p>
        </div>
      </div>
    </section>
  );
}