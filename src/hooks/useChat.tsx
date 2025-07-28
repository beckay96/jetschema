import { createContext, useContext, useState, ReactNode } from 'react';

interface FieldTag {
  table_name: string;
  field_name: string;
}

interface ChatContextType {
  taggedFields: FieldTag[];
  addTaggedField: (tableName: string, fieldName: string) => void;
  removeTaggedField: (index: number) => void;
  clearTaggedFields: () => void;
  setTaggedFields: React.Dispatch<React.SetStateAction<FieldTag[]>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [taggedFields, setTaggedFields] = useState<FieldTag[]>([]);

  const addTaggedField = (tableName: string, fieldName: string) => {
    setTaggedFields(prev => {
      const exists = prev.some(field => 
        field.table_name === tableName && field.field_name === fieldName
      );
      
      if (!exists) {
        return [...prev, { table_name: tableName, field_name: fieldName }];
      }
      
      return prev;
    });
  };

  const removeTaggedField = (index: number) => {
    setTaggedFields(prev => prev.filter((_, i) => i !== index));
  };

  const clearTaggedFields = () => {
    setTaggedFields([]);
  };

  const value = {
    taggedFields,
    addTaggedField,
    removeTaggedField,
    clearTaggedFields,
    setTaggedFields
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}