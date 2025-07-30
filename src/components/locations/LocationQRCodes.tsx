import React, { useState } from 'react';
import { QrCode, Download, Eye, X, Copy, Check } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { QRCodeGenerator } from './QRCodeGenerator';

export function LocationQRCodes() {
  const { locations } = useLocationStore();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const getCheckinUrl = (locationId: string) => {
    return `${window.location.origin}/location/${locationId}`;
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const downloadQRCode = (locationId: string, locationName: string) => {
    const canvas = document.querySelector(`#qr-${locationId} canvas`) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${locationName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">QR Codes</h2>
        <p className="text-gray-600">Generate QR codes for customer check-in at each location</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => {
          const checkinUrl = getCheckinUrl(location.id);
          
          return (
            <div key={location.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">{location.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{location.address}</p>
                
                <div id={`qr-${location.id}`} className="flex justify-center mb-4">
                  <QRCodeGenerator 
                    value={checkinUrl} 
                    size={150}
                    className="border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Check-in URL:</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs text-gray-800 flex-1 truncate">
                      {checkinUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(checkinUrl)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      title="Copy URL"
                    >
                      {copiedUrl === checkinUrl ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedLocation(location.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => downloadQRCode(location.id, location.name)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12">
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-600">Add locations to generate QR codes for customer check-in</p>
        </div>
      )}

      {/* Preview Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">QR Code Preview</h3>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 text-center">
              {(() => {
                const location = locations.find(loc => loc.id === selectedLocation);
                if (!location) return null;
                
                return (
                  <>
                    <h4 className="font-semibold text-gray-900 mb-2">{location.name}</h4>
                    <p className="text-sm text-gray-600 mb-6">{location.address}</p>
                    
                    <div className="flex justify-center mb-6">
                      <QRCodeGenerator 
                        value={getCheckinUrl(location.id)} 
                        size={250}
                        className="border border-gray-200 rounded-lg"
                      />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-2">Customers can scan this QR code to:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Join the queue instantly</li>
                        <li>• See their position in line</li>
                        <li>• Get real-time updates</li>
                        <li>• Receive text notifications</li>
                      </ul>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => copyToClipboard(getCheckinUrl(location.id))}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                      >
                        {copiedUrl === getCheckinUrl(location.id) ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => downloadQRCode(location.id, location.name)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}