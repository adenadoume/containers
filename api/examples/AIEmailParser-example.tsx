// AI Email Parser Component
// src/components/ai/AIEmailParser.tsx

import { useState } from 'react';
import { Sparkles, Mail, Loader2, Check, X } from 'lucide-react';
import { aiAPI } from '../../services/api';

interface AIEmailParserProps {
  onDataExtracted: (data: any) => void;
  containerName?: string;
}

export function AIEmailParser({ onDataExtracted, containerName }: AIEmailParserProps) {
  const [showModal, setShowModal] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleParse = async () => {
    if (!emailContent.trim()) {
      setError('Please paste email content');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const extractedData = await aiAPI.parseEmail(emailContent, containerName);
      setResult(extractedData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse email');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      onDataExtracted(result);
      setShowModal(false);
      setEmailContent('');
      setResult(null);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEmailContent('');
    setResult(null);
    setError('');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
      >
        <Sparkles className="w-5 h-5" />
        AI Parse Email
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-gray-600">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">AI Email Parser</h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-white mb-1">How to use:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Copy the entire email content from your supplier</li>
                      <li>Paste it in the text area below</li>
                      <li>Click "Parse with AI" and wait for extraction</li>
                      <li>Review the extracted data and click "Add to Container"</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Content
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Paste your supplier email here...

Example:
Dear Customer,

We are pleased to confirm your order for 500 cartons of ceramic tiles.

Product: Premium Ceramic Floor Tiles
Quantity: 500 cartons
CBM: 25.5 cubic meters
Gross Weight: 12,500 kg
Unit Price: $45.00 per carton
Total Cost: $22,500.00
Freight Cost: $3,200.00

Status: Ready to ship
Expected shipping date: Next week

Best regards,
ABC Trading Company"
                  className="w-full h-64 px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                  disabled={loading}
                />
              </div>

              {/* Parse Button */}
              <button
                onClick={handleParse}
                disabled={loading || !emailContent.trim()}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Parsing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Parse with AI
                  </>
                )}
              </button>

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Results Display */}
              {result && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">Data extracted successfully!</span>
                  </div>

                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-white mb-3">Extracted Information:</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(result).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-white font-medium">
                            {value !== null && value !== undefined ? String(value) : '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAccept}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg"
                    >
                      <Check className="w-5 h-5" />
                      Add to Container
                    </button>
                    <button
                      onClick={() => {
                        setResult(null);
                        setError('');
                      }}
                      className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

