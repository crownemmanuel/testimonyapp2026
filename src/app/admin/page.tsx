"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PinGate from "@/components/PinGate";
import DatePicker, { getTodayDate } from "@/components/DatePicker";
import {
  getAllTestimoniesByDate,
  getAllTestimonies,
  updateTestimony,
  deleteTestimony,
  addTestimony,
  updateTestimonyStatus,
  getServices,
  addService,
  updateService,
  deleteService,
} from "@/lib/firebase";
import { Testimony, ServiceType } from "@/lib/types";

type TabType = "testimonies" | "services";

const ITEMS_PER_PAGE = 20;

function AdminContent() {
  const [activeTab, setActiveTab] = useState<TabType>("testimonies");
  const [date, setDate] = useState<string>(""); // Empty means show all
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [filteredTestimonies, setFilteredTestimonies] = useState<Testimony[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoadingTestimonies, setIsLoadingTestimonies] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Edit modal state
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Service edit state
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceKey, setNewServiceKey] = useState("");

  // Load testimonies
  const loadTestimonies = async () => {
    setIsLoadingTestimonies(true);
    try {
      let data: Testimony[];
      if (date) {
        // Filter by date if date is provided
        data = await getAllTestimoniesByDate(date);
      } else {
        // Get all testimonies if no date filter
        data = await getAllTestimonies();
      }
      setTestimonies(data);
      setFilteredTestimonies(data);
      setCurrentPage(1); // Reset to first page when filtering
    } catch (error) {
      console.error("Failed to load testimonies:", error);
    } finally {
      setIsLoadingTestimonies(false);
    }
  };

  // Load services
  const loadServices = async () => {
    setIsLoadingServices(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  useEffect(() => {
    loadTestimonies();
  }, [date]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTestimonies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTestimonies = filteredTestimonies.slice(startIndex, endIndex);

  // Reset to page 1 when filtered testimonies change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTestimonies.length]);

  useEffect(() => {
    if (activeTab === "services") {
      loadServices();
    }
  }, [activeTab]);

  // Testimony actions
  const handleStatusChange = async (
    id: string,
    status: "pending" | "approved" | "declined"
  ) => {
    try {
      await updateTestimonyStatus(id, status);
      loadTestimonies();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;
    try {
      await deleteTestimony(id);
      loadTestimonies();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleSaveTestimony = async (testimony: Partial<Testimony>) => {
    try {
      if (isAddingNew) {
        await addTestimony({
          date: testimony.date || getTodayDate(),
          service: testimony.service || "",
          name: testimony.name || "",
          phone: testimony.phone,
          email: testimony.email,
          whatDidYouDo: testimony.whatDidYouDo,
          description: testimony.description || "",
          status: testimony.status || "pending",
          createdAt: Date.now(),
        });
      } else if (editingTestimony) {
        await updateTestimony(editingTestimony.id, testimony);
      }
      setEditingTestimony(null);
      setIsAddingNew(false);
      loadTestimonies();
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  // Service actions
  const handleSaveService = async () => {
    try {
      if (isAddingService) {
        const maxOrder = services.reduce((max, s) => Math.max(max, s.order), 0);
        await addService({
          name: newServiceName,
          key: newServiceKey.toLowerCase().replace(/\s+/g, "-"),
          order: maxOrder + 1,
        });
      } else if (editingService) {
        await updateService(editingService.id, {
          name: newServiceName,
          key: newServiceKey,
        });
      }
      setEditingService(null);
      setIsAddingService(false);
      setNewServiceName("");
      setNewServiceKey("");
      loadServices();
    } catch (error) {
      console.error("Failed to save service:", error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(id);
      loadServices();
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        <header className="bg-slate-100 px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Admin View</h1>
        </header>

        <div className="px-4 py-6 md:px-6 md:py-8 max-w-4xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("testimonies")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "testimonies"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Testimonies
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "services"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Services
          </button>
        </div>

        {activeTab === "testimonies" && (
          <>
            {/* Filters & Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-slate-600 text-sm mb-2">
                  Filter by Date (optional)
                </label>
                <div className="flex gap-2">
                  <DatePicker value={date} onChange={setDate} />
                  {date && (
                    <button
                      onClick={() => setDate("")}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-colors text-sm border border-slate-300"
                      title="Clear date filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {date ? `Showing testimonies from ${date}` : "Showing all testimonies"}
                </p>
              </div>
              <button
                onClick={loadTestimonies}
                className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-colors border border-slate-300"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingTestimony({
                    id: "",
                    date: getTodayDate(),
                    service: services[0]?.key || "",
                    name: "",
                    phone: "",
                    email: "",
                    whatDidYouDo: "",
                    description: "",
                    status: "pending",
                    createdAt: Date.now(),
                  });
                }}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors ml-auto"
              >
                + Add New
              </button>
            </div>

            {/* Count and pagination info */}
            {filteredTestimonies.length > 0 && (
              <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
                <p>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTestimonies.length)} of{" "}
                  {filteredTestimonies.length} testimonies
                </p>
                {totalPages > 1 && (
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>
            )}

            {/* Testimonies Table */}
            {isLoadingTestimonies ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading...</p>
              </div>
            ) : filteredTestimonies.length === 0 ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                <p className="text-slate-600">
                  {date ? "No testimonies for this date" : "No testimonies found"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedTestimonies.map((testimony) => (
                  <div
                    key={testimony.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {testimony.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {testimony.service} | {testimony.date} | {testimony.phone || "No phone"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={testimony.status}
                          onChange={(e) =>
                            handleStatusChange(
                              testimony.id,
                              e.target.value as "pending" | "approved" | "declined"
                            )
                          }
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            statusColors[testimony.status]
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm mb-3 line-clamp-2">
                      {testimony.description}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTestimony(testimony)}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(testimony.id)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors border border-slate-200"
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg transition-colors ${
                                currentPage === page
                                  ? "bg-slate-800 text-white"
                                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-slate-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors border border-slate-200"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "services" && (
          <>
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Manage Services</h2>
              <button
                onClick={() => {
                  setIsAddingService(true);
                  setNewServiceName("");
                  setNewServiceKey("");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + Add Service
              </button>
            </div>

            {isLoadingServices ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-slate-800">
                        {service.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Key: {service.key}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setNewServiceName(service.name);
                          setNewServiceKey(service.key);
                        }}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Edit Testimony Modal */}
        {editingTestimony && (
          <TestimonyEditModal
            testimony={editingTestimony}
            services={services}
            isNew={isAddingNew}
            onSave={handleSaveTestimony}
            onClose={() => {
              setEditingTestimony(null);
              setIsAddingNew(false);
            }}
          />
        )}

        {/* Service Edit Modal */}
        {(editingService || isAddingService) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {isAddingService ? "Add Service" : "Edit Service"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-400"
                    placeholder="e.g., Sunday Service"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Service Key
                  </label>
                  <input
                    type="text"
                    value={newServiceKey}
                    onChange={(e) => setNewServiceKey(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-400"
                    placeholder="e.g., sunday"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingService(null);
                    setIsAddingService(false);
                  }}
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveService}
                  disabled={!newServiceName || !newServiceKey}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// Testimony Edit Modal Component
function TestimonyEditModal({
  testimony,
  services,
  isNew,
  onSave,
  onClose,
}: {
  testimony: Testimony;
  services: ServiceType[];
  isNew: boolean;
  onSave: (data: Partial<Testimony>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    date: testimony.date,
    service: testimony.service,
    name: testimony.name,
    phone: testimony.phone || "",
    email: testimony.email || "",
    whatDidYouDo: testimony.whatDidYouDo || "",
    description: testimony.description,
    status: testimony.status,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {isNew ? "Add Testimony" : "Edit Testimony"}
        </h2>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              >
                <option value="">Select...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              What did they do?
            </label>
            <textarea
              name="whatDidYouDo"
              value={formData.whatDidYouDo}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <PinGate>
      <AdminContent />
    </PinGate>
  );
}
