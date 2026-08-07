import React, { useState } from "react";
import { FileText, Upload, Trash2, Eye, RefreshCw, AlertTriangle, FileCheck } from "lucide-react";
import { useCardDocuments, useUploadCardDocument, useDeleteCardDocument } from "../hooks/useCreditCardQueries";
import { CreditCardDocument } from "../../../types";
import { ConfirmModal } from "../../../components/common/ConfirmModal";

interface CardDocumentsTabProps {
  cardId: string;
}

export const CardDocumentsTab: React.FC<CardDocumentsTabProps> = ({ cardId }) => {
  const { data: documents = [], isLoading, isError, error, refetch } = useCardDocuments(cardId);
  const uploadDocMutation = useUploadCardDocument();
  const deleteDocMutation = useDeleteCardDocument();

  const [previewDoc, setPreviewDoc] = useState<CreditCardDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; name: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "STATEMENT");

      uploadDocMutation.mutate({ cardId, formData });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingDoc) {
      deleteDocMutation.mutate(
        { cardId, documentId: deletingDoc.id },
        {
          onSuccess: () => setDeletingDoc(null),
        }
      );
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Failed to Load Credit Card Documents</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve documents."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Dropzone Header */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 border-dashed border-slate-700 text-center space-y-3">
        <Upload className="w-10 h-10 text-indigo-400 mx-auto" />
        <div>
          <h4 className="text-sm font-bold text-slate-100">Upload Statements or Card Documents</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Attach PDF statements, card member agreements, sanction letters, or tax certificates for secure storage.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all shadow-lg shadow-indigo-600/20">
          <Upload className="w-4 h-4" />
          <span>{uploadDocMutation.isPending ? "Uploading..." : "Select File to Upload"}</span>
          <input
            type="file"
            accept=".pdf,.png,.jpeg,.jpg,.csv"
            onChange={handleFileChange}
            disabled={uploadDocMutation.isPending}
            className="hidden"
          />
        </label>
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Documents Uploaded</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You haven't uploaded any documents for this credit card yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Uploaded At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    <span>{doc.fileName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-purple-400">{doc.category || "STATEMENT"}</td>
                  <td className="py-3.5 px-4 text-slate-400">{formatBytes(doc.sizeBytes || 0)}</td>
                  <td className="py-3.5 px-4 text-slate-400">{doc.uploadedAt}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        title="Preview Document"
                        aria-label="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingDoc({ id: doc.id, name: doc.fileName })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Document"
                        aria-label="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Preview: {previewDoc.fileName}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                aria-label="Close preview"
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="p-8 rounded-2xl bg-slate-950 text-center space-y-2">
              <FileText className="w-12 h-12 text-indigo-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">{previewDoc.fileName}</p>
              <p className="text-[11px] text-slate-400">
                {previewDoc.mimeType} • {formatBytes(previewDoc.sizeBytes)}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingDoc)}
        title="Delete Card Document?"
        message={`Are you sure you want to delete document "${deletingDoc?.name}"?`}
        confirmText="Delete Document"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteDocMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingDoc(null)}
      />
    </div>
  );
};
