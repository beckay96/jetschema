import React from 'react';

interface JetSchemaLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  preserveColor?: boolean;
}

/**
 * JetSchema Logo Component
 * 
 * A reusable component that displays the JetSchema logo
 * 
 * @param className - Additional CSS classes to apply
 * @param size - Predefined size (small, medium, large) or use className for custom sizing
 * @param preserveColor - If true, doesn't apply any text color classes (uses the color from className)
 */
export function JetSchemaLogo({ 
  className = "", 
  size = "medium",
  preserveColor = false
}: JetSchemaLogoProps) {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8"
  };
  
  const sizeClass = sizeClasses[size] || "";
  const colorClass = preserveColor ? "" : "text-primary";
  
  return (
    <img 
      src="/jetschema-logo.png" 
      alt="JetSchema Logo" 
      className={`${sizeClass} ${colorClass} ${className}`}
    />
  );
}
