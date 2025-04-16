import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Image from 'next/image';
import { useProductClassification } from '../context/ProductClassificationContext';

interface Message {
  id: string;
  sender: 'user' | 'sarah';
  content: string | React.ReactNode;
  timestamp: Date;
}

const ConversationPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'sarah',
      content: (
        <div>
          <p className="mb-3">Welcome to the product classification step! I'll help you correctly classify your products using Harmonized System (HS) codes, which are essential for international trade.</p>
          <p className="mb-3">I've identified several products from your website. Let's go through each one and assign the proper HS code.</p>
          <p>To start, select a product from the list on the right, and I'll guide you through the classification process.</p>
        </div>
      ),
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const { products, expandedProductId } = useProductClassification();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setInputValue('');
    
    // Simulate Sarah's response
    setTimeout(() => {
      let responseContent: string | React.ReactNode;
      
      // Generate contextual response based on user's question
      if (inputValue.toLowerCase().includes('hs code')) {
        responseContent = (
          <div>
            <p className="mb-3">HS codes (Harmonized System codes) are standardized numerical codes used globally to classify traded products.</p>
            <p className="mb-3">The code structure is hierarchical:</p>
            <ul className="list-disc pl-5 mb-3">
              <li>First 2 digits: Chapter (broad category)</li>
              <li>Digits 3-4: Heading (more specific category)</li>
              <li>Digits 5-6: Subheading (detailed product specification)</li>
            </ul>
            <p>Correct classification ensures proper tariffs, documentation, and compliance with trade regulations.</p>
          </div>
        );
      } else if (inputValue.toLowerCase().includes('help')) {
        responseContent = (
          <div>
            <p className="mb-3">I'm here to help you with product classification! Here's what you can do:</p>
            <ul className="list-disc pl-5 mb-3">
              <li>Select a product from the list on the right</li>
              <li>Follow the step-by-step classification process</li>
              <li>Ask me about HS codes or the classification process</li>
              <li>Add new products if needed</li>
            </ul>
            <p>Is there something specific you need help with?</p>
          </div>
        );
      } else {
        const selectedProduct = products.find(p => p.id === expandedProductId);
        
        if (selectedProduct) {
          responseContent = `I see you're working on classifying "${selectedProduct.name}". Follow the step-by-step process on the right to select the appropriate chapter, heading, and subheading. Let me know if you have any questions!`;
        } else {
          responseContent = "I'm happy to help with that. Is there anything specific about product classification you'd like to know?";
        }
      }
      
      const sarahResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'sarah',
        content: responseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, sarahResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pb-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'sarah' && (
              <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 mr-3 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">SA</span>
                </div>
              </div>
            )}
            
            <div 
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.sender === 'user' 
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {message.sender === 'sarah' && (
                <div className="text-purple-600 font-semibold mb-1">Sarah</div>
              )}
              <div>{message.content}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Reply Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => {
            setInputValue("What is an HS code?");
            // Trigger form submission programmatically
            document.getElementById('message-form')?.dispatchEvent(
              new Event('submit', { cancelable: true, bubbles: true })
            );
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm"
        >
          What is an HS code?
        </button>
        
        <button
          onClick={() => {
            setInputValue("How do I know which classification is correct?");
            document.getElementById('message-form')?.dispatchEvent(
              new Event('submit', { cancelable: true, bubbles: true })
            );
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm"
        >
          How do I choose correctly?
        </button>
        
        <button
          onClick={() => {
            setInputValue("Help me classify my products");
            document.getElementById('message-form')?.dispatchEvent(
              new Event('submit', { cancelable: true, bubbles: true })
            );
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm"
        >
          Help me classify products
        </button>
      </div>
      
      {/* Input Form */}
      <form 
        id="message-form"
        onSubmit={handleSendMessage} 
        className="sticky bottom-0 bg-white border-t border-gray-200 p-4"
      >
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white p-2 rounded-r-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConversationPanel;
