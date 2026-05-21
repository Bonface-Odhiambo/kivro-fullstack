import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Trash2,
  Eye,
  Search,
  Users,
  Copy,
  X
} from 'lucide-react';

interface SharedDocument {
  id: string;
  document_name: string;
  document_id: string;
  created_at: string;
  view_count: number;
  download_count: number;
  people_count: number;
  share_type: string;
  shared_with: string;
}

export default function Shared() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchDocuments();
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch shared files from database
      const { data, error } = await supabase
        .from('shared_files')
        .select('*')
        .or(`owner_id.eq.${session.user.id},shared_with_user_ids.cs.{${session.user.id}}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database data to match our interface
      const transformedDocuments: SharedDocument[] = (data || []).map(file => ({
        id: file.id,
        document_name: file.item_name,
        document_id: file.share_id,
        created_at: file.created_at,
        view_count: file.view_count || 0,
        download_count: file.download_count || 0,
        people_count: (file.shared_with_emails?.length || 0) + (file.shared_with_user_ids?.length || 0),
        share_type: file.share_type.charAt(0).toUpperCase() + file.share_type.slice(1),
        shared_with: file.shared_with_emails?.[0] || 'Not shared'
      }));

      setDocuments(transformedDocuments);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load shared documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shared document?')) return;

    try {
      const { error } = await supabase
        .from('shared_files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({
        title: "Document Deleted",
        description: "Shared document has been removed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shared_files')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({
        title: "Share Revoked",
        description: "Share access has been revoked"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke share",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Shared</h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>

      {/* Latest Section with Delete Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-900">Latest</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 mx-auto border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-500">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No shared documents</h3>
            <p className="text-gray-500">Your shared documents will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-sm transition-shadow border border-gray-200 cursor-pointer"
              onClick={() => setSelectedDocument(doc)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Document Icon */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>

                  {/* Document Name and ID */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{doc.document_name}</h3>
                    <p className="text-sm text-gray-500">{doc.document_id}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(doc.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>

                  {/* Stats Badges */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {doc.view_count} views
                    </Badge>
                    <Badge variant="outline" className="bg-gray-900 text-white border-gray-900 flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {doc.download_count} download
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500 text-white border-blue-500 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {doc.people_count} people
                    </Badge>
                    <Badge variant="outline" className="bg-green-500 text-white border-green-500 w-8 h-8 rounded-md flex items-center justify-center p-0">
                      ✓
                    </Badge>
                  </div>

                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedDocuments.has(doc.id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedDocuments);
                      if (checked) {
                        newSelected.add(doc.id);
                      } else {
                        newSelected.delete(doc.id);
                      }
                      setSelectedDocuments(newSelected);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Shared Document Details Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDocument.document_name} Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Share ID and Share Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Share ID:</p>
                    <p className="font-semibold text-gray-900">{selectedDocument.document_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Share Type:</p>
                    <p className="font-semibold text-gray-900">{selectedDocument.share_type}</p>
                  </div>
                </div>

                {/* Views, Downloads, Share with */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Views:</p>
                    <p className="font-semibold text-gray-900">{selectedDocument.view_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Downloads:</p>
                    <p className="font-semibold text-gray-900">{selectedDocument.download_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Share with:</p>
                    <p className="font-semibold text-gray-900 text-xs break-all">{selectedDocument.shared_with}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://kivro.africa/shared/${selectedDocument.document_id}`);
                      toast({
                        title: "Link Copied!",
                        description: "Share link copied to clipboard"
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={async () => {
                      await handleRevoke(selectedDocument.id);
                      setSelectedDocument(null);
                    }}
                  >
                    Revoke
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleDelete(selectedDocument.id);
                      setSelectedDocument(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
