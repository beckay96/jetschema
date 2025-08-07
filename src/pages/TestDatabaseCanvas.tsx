import React from 'react';
import { DatabaseCanvas } from '@/components/database/DatabaseTablesComponents/DatabaseCanvas';

const TestDatabaseCanvas = () => {
  const [tables, setTables] = React.useState<any[]>([]);
  
  return (
    <div className="h-screen w-screen">
      <DatabaseCanvas
        tables={tables}
        setTables={setTables}
        selectedTable={null}
        setSelectedTable={() => {}}
        onAddTable={() => {}}
        onDeleteTable={() => {}}
        onEditTable={() => {}}
        onEditField={() => {}}
        onDeleteField={() => {}}
        onAddField={() => {}}
        onSave={() => {}}
        onAddComment={() => {}}
        onMarkAsTask={() => {}}
        onNavigateToElement={() => {}}
      />
    </div>
  );
};

export default TestDatabaseCanvas;
