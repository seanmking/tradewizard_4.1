import React from 'react';
import { Certification, Product } from '../../../context/AssessmentContext';

interface CertificationsChecklistProps {
  certifications: Certification[];
  confirmedProducts: Product[];
}

const CertificationsChecklist: React.FC<CertificationsChecklistProps> = ({ certifications, confirmedProducts }) => (
  <div className="p-4 bg-white border rounded shadow mt-4">
    <h3 className="text-lg font-semibold mb-2">Certification Requirements</h3>
    {certifications.length > 0 ? (
      <ul>
        {certifications.map((cert, idx) => (
          <li key={idx} className="mb-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{cert.name}</span>
              {cert.confidence != null && (
                <span className="text-sm text-gray-500">
                  Confidence: {Math.round(cert.confidence * 100)}%
                </span>
              )}
            </div>
            <div className="flex space-x-2 mt-2">
              <button className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                Already Have
              </button>
              <button className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                Need Help
              </button>
              {cert.cost && <span className="text-sm">Cost: {cert.cost}</span>}
              {cert.timeline && <span className="text-sm">Timeline: {cert.timeline}</span>}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500">No certification requirements detected.</p>
    )}
  </div>
);

export default CertificationsChecklist;
