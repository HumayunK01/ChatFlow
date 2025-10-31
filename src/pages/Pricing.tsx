import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Logo } from '@/components/Logo';

const Pricing = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out ChatFlow',
      features: [
        'Access to all available models',
        'Unlimited conversations',
        'Chat history storage',
        'Basic support',
        'Image generation (MiniMax M2)',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: 'month',
      description: 'For power users and professionals',
      features: [
        'Everything in Free',
        'Priority API access',
        'Advanced model access',
        'Extended chat history',
        'Priority support',
        'Export conversations',
        'API access',
      ],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Custom model configurations',
        'Dedicated support',
        'SLA guarantee',
        'Custom integrations',
        'Team management',
        'Advanced analytics',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/">
            <Button variant="ghost">Back to Chat</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? 'border-primary shadow-lg scale-105 md:scale-105 lg:scale-110'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  )}
                </div>
                <CardDescription className="mt-4 text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;

