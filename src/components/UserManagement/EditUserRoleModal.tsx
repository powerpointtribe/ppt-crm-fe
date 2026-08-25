import { useState, useEffect } from 'react';
import { X, Edit, Plus, Trash2, Calendar, ShoppingBag, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import userInvitationsService from '../../services/user-invitations';
import type { ActiveUser } from '../../services/user-invitations';
import { rolesService } from '../../services/roles';
import { membersService } from '../../services/members-unified';
import { eventsService } from '../../services/events';
import { getProducts } from '../../services/store';

interface Role {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  modules?: string[];
}

interface EventItem {
  _id: string;
  title: string;
  startDate: string;
  status?: string;
}

interface ProductItem {
  _id: string;
  name: string;
  isActive: boolean;
}

interface EditUserRoleModalProps {
  user: ActiveUser;
  onClose: () => void;
  onSuccess: () => void;
  onRefresh?: () => void;
}

const EVENT_VIEWER_NAMES = ['event viewer', 'event-viewer', 'eventviewer'];
const STORE_ROLE_NAMES = [
  'store viewer', 'store-viewer', 'storeviewer',
  'store manager', 'store-manager', 'storemanager',
  'store owner', 'store-owner', 'storeowner',
];

function isEventViewerRole(role: { name: string; displayName?: string }) {
  const n = (role.name || '').toLowerCase();
  const d = (role.displayName || '').toLowerCase();
  return EVENT_VIEWER_NAMES.some((ev) => n.includes(ev) || d.includes(ev));
}

function isStoreRole(role: { name: string; displayName?: string; modules?: string[] }) {
  if (role.modules?.includes('store')) return true;
  const n = (role.name || '').toLowerCase();
  const d = (role.displayName || '').toLowerCase();
  return STORE_ROLE_NAMES.some((sv) => n.includes(sv) || d.includes(sv));
}

export default function EditUserRoleModal({ user, onClose, onSuccess, onRefresh }: EditUserRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState(user.role?._id || '');
  const [additionalRoles, setAdditionalRoles] = useState<{ _id: string; name: string; displayName: string }[]>(
    user.additionalRoles || [],
  );
  const [addRoleId, setAddRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);

  // Scoped events state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [eventsLoading, setEventsLoading] = useState(false);
  const [savingEvents, setSavingEvents] = useState(false);
  const [eventsDirty, setEventsDirty] = useState(false);

  // Scoped products state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [productsLoading, setProductsLoading] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);
  const [productsDirty, setProductsDirty] = useState(false);

  const toast = useToast();

  const hasEventViewerRole = additionalRoles.some(isEventViewerRole);

  const selectedPrimaryRole = roles.find((r) => r._id === selectedRoleId);
  const hasStoreRole =
    additionalRoles.some((r) => isStoreRole(r)) ||
    (selectedPrimaryRole ? isStoreRole(selectedPrimaryRole) : false);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const roles = await rolesService.getRoles({ isActive: true });
        setRoles(roles);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        toast.error('Failed to load roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Load events + scoped selection when Event Viewer role is present
  useEffect(() => {
    if (!hasEventViewerRole) return;

    const loadEventsAndScope = async () => {
      setEventsLoading(true);
      try {
        const [eventsRes, scopedIds] = await Promise.all([
          eventsService.getEvents({ limit: 100, sortBy: 'startDate', sortOrder: 'desc' }),
          membersService.getScopedEvents(user._id),
        ]);
        setEvents(eventsRes.items || []);
        setSelectedEventIds(new Set(scopedIds));
      } catch (error: any) {
        console.error('Failed to load events:', error);
        toast.error(error?.message || 'Failed to load events');
      } finally {
        setEventsLoading(false);
      }
    };

    loadEventsAndScope();
  }, [hasEventViewerRole, user._id]);

  // Load products + scoped selection when Store Viewer role is present
  useEffect(() => {
    if (!hasStoreRole) return;

    const loadProductsAndScope = async () => {
      setProductsLoading(true);
      try {
        const [productsRes, scopedIds] = await Promise.all([
          getProducts({ limit: 100 }),
          membersService.getScopedProducts(user._id),
        ]);
        const list = (productsRes as any)?.data || (productsRes as any)?.items || [];
        setProducts(Array.isArray(list) ? list : []);
        setSelectedProductIds(new Set(scopedIds));
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };

    loadProductsAndScope();
  }, [hasStoreRole, user._id]);

  const availableForAdditional = roles.filter(
    (r) =>
      r._id !== selectedRoleId &&
      !additionalRoles.some((ar) => ar._id === r._id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoleId) {
      toast.error('Please select a primary role');
      return;
    }

    if (selectedRoleId === user.role?._id) {
      toast.info('No changes made');
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await userInvitationsService.updateUserRole(user._id, {
        roleId: selectedRoleId,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to update user role';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRole = async () => {
    if (!addRoleId) return;

    setSubmitting(true);
    try {
      await membersService.addRole(user._id, addRoleId);
      const addedRole = roles.find((r) => r._id === addRoleId);
      if (addedRole) {
        setAdditionalRoles((prev) => [
          ...prev,
          { _id: addedRole._id, name: addedRole.name, displayName: addedRole.displayName },
        ]);
      }
      setAddRoleId('');
      toast.success('Additional role added');
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to add role:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to add role';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    setRemovingRoleId(roleId);
    try {
      await membersService.removeRole(user._id, roleId);
      setAdditionalRoles((prev) => prev.filter((r) => r._id !== roleId));
      toast.success('Role removed');
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to remove role:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to remove role';
      toast.error(message);
    } finally {
      setRemovingRoleId(null);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
    setEventsDirty(true);
  };

  const handleSaveEventScope = async () => {
    setSavingEvents(true);
    try {
      await membersService.setScopedEvents(user._id, Array.from(selectedEventIds));
      toast.success('Event access updated');
      setEventsDirty(false);
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to save scoped events:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to save event access';
      toast.error(message);
    } finally {
      setSavingEvents(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
    setProductsDirty(true);
  };

  const handleSaveProductScope = async () => {
    setSavingProducts(true);
    try {
      await membersService.setScopedProducts(user._id, Array.from(selectedProductIds));
      toast.success('Store product access updated');
      setProductsDirty(false);
      onRefresh?.();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to save product access';
      toast.error(message);
    } finally {
      setSavingProducts(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="sm">
      <div className="p-3">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="bg-blue-100 p-1.5 rounded-lg mr-2">
              <Edit className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit User Roles</h2>
              <p className="text-[10px] text-gray-500">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-3">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Primary Role</p>
                  {user.role ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {user.role.displayName || user.role.name}
                    </Badge>
                  ) : (
                    <Badge className="text-[10px]">No Role</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Role Selection */}
            <form onSubmit={handleSubmit}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Primary Role <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a role...</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.displayName || role.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={submitting || !selectedRoleId || selectedRoleId === user.role?._id}>
                  {submitting ? <LoadingSpinner /> : 'Save'}
                </Button>
              </div>
            </form>

            {/* Additional Roles */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Additional Roles
              </label>

              {/* Current additional roles */}
              {additionalRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {additionalRoles.map((role) => (
                    <span
                      key={role._id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs"
                    >
                      {role.displayName || role.name}
                      <button
                        onClick={() => handleRemoveRole(role._id)}
                        disabled={removingRoleId === role._id}
                        className="text-purple-400 hover:text-red-500 transition-colors"
                      >
                        {removingRoleId === role._id ? (
                          <LoadingSpinner />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 mb-2">No additional roles assigned</p>
              )}

              {/* Add additional role */}
              {availableForAdditional.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={addRoleId}
                    onChange={(e) => setAddRoleId(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Add a role...</option>
                    {availableForAdditional.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.displayName || role.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRole}
                    disabled={!addRoleId || submitting}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Scoped Event Access — shown when Event Viewer role is assigned */}
            {hasEventViewerRole && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  Event Access
                </label>
                <p className="text-[10px] text-gray-400 mb-2">
                  Select which events this user can view. If none are selected, they can see all events.
                </p>

                {eventsLoading ? (
                  <div className="flex justify-center py-3">
                    <LoadingSpinner />
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-[10px] text-gray-400">No events found</p>
                ) : (
                  <>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {events.map((event) => {
                        const checked = selectedEventIds.has(event._id);
                        return (
                          <label
                            key={event._id}
                            className={`flex items-center gap-2.5 px-2.5 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                              checked ? 'bg-purple-50/50' : ''
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                checked
                                  ? 'bg-purple-600 border-purple-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEvent(event._id)}
                              className="sr-only"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {event.title}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {formatDate(event.startDate)}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {eventsDirty && (
                      <div className="flex justify-end mt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveEventScope}
                          disabled={savingEvents}
                        >
                          {savingEvents ? <LoadingSpinner /> : 'Save Event Access'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Scoped Store Product Access — shown when Store Viewer/Manager role is assigned */}
            {hasStoreRole && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                  Store Product Access
                </label>
                <p className="text-[10px] text-gray-400 mb-2">
                  Select which products this user can manage. If none are selected, they can see all products.
                </p>

                {productsLoading ? (
                  <div className="flex justify-center py-3">
                    <LoadingSpinner />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-[10px] text-gray-400">No products found</p>
                ) : (
                  <>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {products.map((product) => {
                        const checked = selectedProductIds.has(product._id);
                        return (
                          <label
                            key={product._id}
                            className={`flex items-center gap-2.5 px-2.5 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                              checked ? 'bg-emerald-50/50' : ''
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                checked
                                  ? 'bg-emerald-600 border-emerald-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProduct(product._id)}
                              className="sr-only"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              product.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {productsDirty && (
                      <div className="flex justify-end mt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveProductScope}
                          disabled={savingProducts}
                        >
                          {savingProducts ? <LoadingSpinner /> : 'Save Product Access'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Warning */}
            {(selectedRoleId !== user.role?._id || additionalRoles.length !== (user.additionalRoles?.length || 0)) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-[10px] text-yellow-800">
                  Permission changes take effect immediately. User may need to re-login.
                </p>
              </div>
            )}

            {/* Close */}
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
