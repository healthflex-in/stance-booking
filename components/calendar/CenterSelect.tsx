import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@apollo/client';

import { Button } from '@/components/ui-atoms/Button';
import { Center } from '@/gql/graphql';
import { GET_CENTERS } from '@/gql/queries';

interface CenterSelectProps {
  onSelect: (centerId: string) => void;
}

export default function CenterSelect({ onSelect }: CenterSelectProps) {
  const { data: centersData } = useQuery(GET_CENTERS);
  const centers = centersData?.centers || [];
  
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Center | null>(null);
  
  React.useEffect(() => {
    if (centers.length > 0 && !selected) {
      setSelected(centers[0]);
    }
  }, [centers, selected]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-48 justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected?.name || 'Select Center'}
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-lg shadow-lg z-50">
          {centers.length > 0 ? centers.map((center: Center) => (
            <div
              key={center._id}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setSelected(center);
                onSelect(center._id);
                setIsOpen(false);
              }}
            >
              {center.name}
            </div>
          )) : (
            <div className="px-4 py-2 text-gray-500">No centers available</div>
          )}
        </div>
      )}
    </div>
  );
} 