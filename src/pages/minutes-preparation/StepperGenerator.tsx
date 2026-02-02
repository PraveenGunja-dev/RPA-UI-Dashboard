import React from 'react';
import StepperForm from '@/components/minutes-preparation/StepperForm';
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import { FileText } from 'lucide-react';

const StepperGenerator = () => {
  // Define navigation items for this product
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: FileText,
      href: '/',
    },
    {
      id: 'dashboard',
      label: 'Minutes Generator',
      icon: FileText,
      href: '/minutes-preparation',
    }
  ];

  return (
    <ProductDashboardLayout 
      productName="Minutes Generator" 
      productRoute="/minutes-preparation"
      navigationItems={navigationItems}
    >
      <StepperForm />
    </ProductDashboardLayout>
  );
};

export default StepperGenerator;