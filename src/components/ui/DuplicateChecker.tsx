import React, { useState, useEffect } from 'react';
import { AlertTriangle, User, CheckCircle, X, Merge } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import Card from './Card';
import { membersService } from '@/services/members';

interface Duplicate {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipStatus: string;
  dateJoined: string;
  duplicateFields: string[];
}

interface DuplicateCheckerProps {
  email?: string;
  phone?: string;
  onDuplicatesFound?: (duplicates: Duplicate[]) => void;
  onNoDuplicatesFound?: () => void;
  showModal?: boolean;
  onModalClose?: () => void;
  excludeMemberId?: string;
  autoCheck?: boolean;
  className?: string;
}

export default function DuplicateChecker({
  email,
  phone,
  onDuplicatesFound,
  onNoDuplicatesFound,
  showModal = false,
  onModalClose,
  excludeMemberId,
  autoCheck = false,
  className
}: DuplicateCheckerProps) {
  const [checking, setChecking] = useState(false);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);

  const checkForDuplicates = async () => {
    if (!email && !phone) return;

    setChecking(true);
    try {
      const result = await membersService.checkForDuplicates({ email, phone });

      if (result.hasDuplicates) {
        setDuplicates(result.duplicates);
        setShowDuplicateModal(true);
        onDuplicatesFound?.(result.duplicates);
      } else {
        setDuplicates([]);
        onNoDuplicatesFound?.();
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      if (error.response?.data?.duplicates) {
        setDuplicates(error.response.data.duplicates);
        setShowDuplicateModal(true);
        onDuplicatesFound?.(error.response.data.duplicates);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleMerge = async (primaryId: string) => {
    if (selectedForMerge.length === 0) return;

    try {
      await membersService.mergeDuplicates({
        primaryMemberId: primaryId,
        duplicateMemberIds: selectedForMerge
      });

      setDuplicates([]);
      setSelectedForMerge([]);
      setMergeMode(false);
      setShowDuplicateModal(false);
      onModalClose?.();

      // Refresh the check
      await checkForDuplicates();
    } catch (error) {
      console.error('Error merging duplicates:', error);
    }
  };

  useEffect(() => {
    if (autoCheck && (email || phone)) {
      checkForDuplicates();
    }
  }, [email, phone, autoCheck]);

  const DuplicateWarning = () => (
    <div className={cn("mb-4", className)}>
      {duplicates.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-yellow-800 font-medium">
                Potential Duplicates Found
              </h3>
              <p className="text-yellow-700 text-sm mt-1">
                {duplicates.length} potential duplicate record{duplicates.length > 1 ? 's' : ''} found.
                Please review before proceeding.
              </p>
              <Button
                onClick={() => setShowDuplicateModal(true)}
                className="mt-2 text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                size="sm"
              >
                Review Duplicates
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const DuplicateModal = () => (
    <Modal
      isOpen={showDuplicateModal || showModal}
      onClose={() => {
        setShowDuplicateModal(false);
        onModalClose?.();
        setMergeMode(false);
        setSelectedForMerge([]);
      }}
      title="Potential Duplicate Members"
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-amber-800 font-medium">Duplicate Records Detected</h4>
              <p className="text-amber-700 text-sm mt-1">
                The following members have matching {duplicates.some(d => d.duplicateFields?.includes('email')) ? 'email' : ''}
                {duplicates.some(d => d.duplicateFields?.includes('email')) && duplicates.some(d => d.duplicateFields?.includes('phone')) ? ' and ' : ''}
                {duplicates.some(d => d.duplicateFields?.includes('phone')) ? 'phone' : ''} information.
              </p>
            </div>
          </div>
        </div>

        {!mergeMode && (
          <div className="flex gap-2">
            <Button
              onClick={() => setMergeMode(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Merge className="h-4 w-4 mr-2" />
              Merge Records
            </Button>
          </div>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {duplicates.map((duplicate) => (
            <Card key={duplicate.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="bg-gray-100 rounded-full p-2">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{duplicate.name}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {duplicate.membershipStatus}
                      </span>
                    </div>

                    <div className="mt-1 space-y-1">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className={duplicate.duplicateFields?.includes('email') ? 'bg-red-100 text-red-800 px-1 rounded' : ''}>
                            {duplicate.email}
                          </span>
                        </span>
                        <span className="flex items-center">
                          <span className={duplicate.duplicateFields?.includes('phone') ? 'bg-red-100 text-red-800 px-1 rounded' : ''}>
                            {duplicate.phone}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Joined: {new Date(duplicate.dateJoined).toLocaleDateString()}
                      </p>
                    </div>

                    {duplicate.duplicateFields && duplicate.duplicateFields.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {duplicate.duplicateFields.map((field) => (
                          <span
                            key={field}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800"
                          >
                            Duplicate {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {mergeMode && (
                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedForMerge.includes(duplicate.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForMerge([...selectedForMerge, duplicate.id]);
                          } else {
                            setSelectedForMerge(selectedForMerge.filter(id => id !== duplicate.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-xs">Merge into this</span>
                    </label>
                    <Button
                      onClick={() => handleMerge(duplicate.id)}
                      disabled={selectedForMerge.length === 0}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Keep as Primary
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {mergeMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>How to merge:</strong> Select the records you want to merge, then click "Keep as Primary"
              on the record you want to keep. The selected records will be merged into the primary record
              and then deactivated.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );

  return (
    <>
      {!autoCheck && (
        <div className={cn("mb-4", className)}>
          <Button
            onClick={checkForDuplicates}
            disabled={checking || (!email && !phone)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {checking ? (
              <>Checking for duplicates...</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Check for Duplicates
              </>
            )}
          </Button>
        </div>
      )}

      <DuplicateWarning />
      <DuplicateModal />
    </>
  );
}