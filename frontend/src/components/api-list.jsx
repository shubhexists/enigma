"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Plus, Trash2, Loader2, Copy as CopyIcon } from "lucide-react"
import { toast } from "sonner"
import {
  listUserApis,
  listAllApis,
  createApi
} from "@/lib/api-client"


const CATEGORIES = [
  'Tools',
  'Weather',
  'Finance',
  'Sports',
  'NewsMedia',
  'Entertainment',
  'Gaming',
  'Education',
  'Health',
  'Travel',
  'Food',
  'Shopping',
  'SocialMedia',
  'Business',
  'Technology',
  'Science',
  'Government',
  'Transportation',
  'RealEstate',
  'Environment',
  'Other'
]

const getMethodColor = () => "method-badge"


export function APIList({ userId, onStatsChange = () => {} }) {
  const [apis, setApis] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAPI, setSelectedAPI] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState("all")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_url: "",
    category: "Tools",
    endpoints: [],
    pricing: {
      enabled: false,
      sol_public_key: "",
      cost_per_request: 0,
    },
  })
  const [currentEndpoint, setCurrentEndpoint] = useState({
    path: "",
    method: "GET",
    headers: undefined,
    body_schema: undefined,
    query_params: undefined,
  })

  const handleCopy = useCallback(async (label, value) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied to clipboard`)
    } catch (err) {
      console.error('Failed to copy', err)
      toast.error(`Unable to copy ${label.toLowerCase()}`)
    }
  }, [])

  useEffect(() => {
    const loadApis = async () => {
      try {
        setLoading(true)
        
        let fetchedApis = []
        let userApisForStats = []
        
        try {
          if (viewMode === "all") {
            try {
              userApisForStats = await listUserApis(userId)
              
              fetchedApis = await listAllApis()
              
              if (fetchedApis.length === 0 && userApisForStats.length > 0) {
                toast.warning('Marketplace API issue detected', {
                  description: 'Using your APIs as a temporary fallback'
                })
                fetchedApis = userApisForStats
              }
            } catch (error) {
              fetchedApis = await listUserApis(userId)
              userApisForStats = fetchedApis
            }
          } else {
            fetchedApis = await listUserApis(userId)
            userApisForStats = fetchedApis
          }
          
        } catch (apiError) {
          toast.error('Error loading APIs', {
            description: apiError?.message || 'Please try refreshing the page'
          })
          
          fetchedApis = []
        }
        
        if (!Array.isArray(fetchedApis)) {
          fetchedApis = []
        }
        
        const converted = fetchedApis.map((api) => ({
          id: api.id,
          owner_id: api.user_id,
          name: api.name,
          description: api.description || "",
          base_url: api.base_url,
          endpoints: api.endpoints || [],
          pricing: api.payment_config || {
            enabled: false,
            sol_public_key: "",
            cost_per_request: 0,
          },
          created_at: api.created_at,
          updated_at: api.updated_at,
          category: api.category || "Other",
        }))
        
        setApis(converted)

        const marketplaceCount = converted.length
        const personalCount = (userApisForStats.length > 0
          ? userApisForStats.length
          : converted.filter((api) => api.owner_id === userId).length)
        const categoryCount = new Set(converted.map((api) => api.category)).size

        onStatsChange({
          marketplace: marketplaceCount,
          personal: personalCount,
          categories: categoryCount,
        })
      } catch (error) {
        toast.error('Error loading APIs', {
          description: error?.message || 'Please try refreshing the page'
        })
        
        setApis([])
        onStatsChange({
          marketplace: 0,
          personal: 0,
          categories: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    loadApis()
  }, [userId, viewMode, onStatsChange])

  const filteredAPIs = useMemo(() => {
    return apis.filter((api) => {
      const matchesSearch =
        api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategory === "all" || api.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [apis, searchQuery, selectedCategory])

  const handleAPIClick = (api) => {
    setSelectedAPI(api)
    setIsOpen(true)
  }

  const handleAddEndpoint = () => {
    if (!currentEndpoint.path) {
      toast.error("Invalid Endpoint", {
        description: "Endpoint path is required"
      });
      return;
    }
    
    const endpoint = {
      path: currentEndpoint.path,
      method: currentEndpoint.method,
      headers: currentEndpoint.headers,
      body_schema: currentEndpoint.body_schema,
      query_params: currentEndpoint.query_params
    };
    
    setFormData({
      ...formData,
      endpoints: [...formData.endpoints, endpoint],
    });
    
    setCurrentEndpoint({
      path: "",
      method: "GET",
      headers: undefined,
      body_schema: undefined,
      query_params: undefined,
    });
  }

  const handleRemoveEndpoint = (index) => {
    setFormData({
      ...formData,
      endpoints: formData.endpoints.filter((_, i) => i !== index),
    })
  }

  const handleCreateSubmit = async () => {
    try {
      setLoading(true);
      
      if (!formData.name || !formData.base_url) {
        toast.error("Missing required fields", {
          description: "API name and base URL are required"
        });
        setLoading(false);
        return;
      }

      try {
        const baseUrl = new URL(formData.base_url);
        if (!['http:', 'https:'].includes(baseUrl.protocol)) {
          toast.error("Invalid URL", {
            description: "URL must start with http:// or https://"
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        toast.error("Invalid URL format", {
          description: "Please enter a valid URL"
        });
        setLoading(false);
        return;
      }

      const request = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category, 
        base_url: formData.base_url,
        endpoints: formData.endpoints,
        payment_config: formData.pricing.enabled ? {
          sol_public_key: formData.pricing.sol_public_key,
          cost_per_request: formData.pricing.cost_per_request,
          enabled: true
        } : undefined
      };
      
      if (request.endpoints.length === 0) {
        toast.warning("No endpoints defined", {
          description: "You can add endpoints later"
        });
      }

      const createdApi = await createApi(userId, request);
        
      const newApi = {
        id: createdApi.id,
        owner_id: createdApi.user_id,
        name: createdApi.name,
        description: createdApi.description || "",
        base_url: createdApi.base_url,
        endpoints: createdApi.endpoints || [],
        pricing: createdApi.payment_config || {
          enabled: false,
          sol_public_key: "",
          cost_per_request: 0,
        },
        created_at: createdApi.created_at,
        updated_at: createdApi.updated_at,
        category: createdApi.category,
      }

      setApis([newApi, ...apis]);

      toast.success("API created successfully!", {
        description: `${formData.name} has been added to your collection`,
      });

      setIsCreateOpen(false);
      setCreateStep(1);
      setFormData({
        name: "",
        description: "",
        base_url: "",
        category: "Tools",
        endpoints: [],
        pricing: {
          enabled: false,
          sol_public_key: "",
          cost_per_request: 0,
        },
      });
    } catch (error) {
      toast.error("API Creation Failed", {
        description: error?.message || "Please check your inputs and try again"
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
        <div className="marketplace-header">
          <div>
            <h1 className="marketplace-title">API Marketplace</h1>
            <p className="marketplace-subtitle">Browse and explore available APIs</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="tabs-section">
              <button
                onClick={() => setViewMode("all")}
                className={`tab-button ${viewMode === "all" ? "tab-active" : "tab-inactive"}`}
              >
                All APIs
              </button>
              <button
                onClick={() => setViewMode("user")}
                className={`tab-button ${viewMode === "user" ? "tab-active" : "tab-inactive"}`}
              >
                My APIs
              </button>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="create-api-button gap-2">
              <Plus className="w-4 h-4" />
              Create API
            </Button>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-bar">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <Input
                placeholder="Search APIs by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="category-select-wrapper">
              <label htmlFor="category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="results-summary">
            Showing {filteredAPIs.length} of {apis.length}{" "}
            {viewMode === "all" ? "APIs in marketplace" : "of your APIs"}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="loading-spinner mb-4"></div>
            <p className="loading-text">Loading APIs...</p>
          </div>
        ) : filteredAPIs.length > 0 ? (
          <div className="api-grid">
            {filteredAPIs.map((api) => (
              <div
                key={api.id}
                className="api-card"
                onClick={() => handleAPIClick(api)}
              >
                <div className="api-card-header">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h2 className="api-name">{api.name}</h2>
                      <div className="flex gap-2 flex-wrap">
                        <span className="api-category">
                          {api.category}
                        </span>
                        {viewMode === "all" && api.owner_id === userId && (
                          <span className="api-tag-owned">
                            Your API
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="api-description">{api.description}</p>
                </div>

                <div className="api-details">
                  <div className="detail-section">
                    <span className="detail-label">Base URL</span>
                    <span className="detail-value">
                      <span className="base-url">{api.base_url}</span>
                    </span>
                  </div>

                  <div className="detail-section">
                    <span className="detail-label">Endpoints</span>
                    <span className="detail-value">
                      <div className="endpoints-list">
                        {api.endpoints.slice(0, 2).map((endpoint, idx) => (
                          <span key={idx} className="endpoint-badge">
                            {endpoint.method}
                          </span>
                        ))}
                        {api.endpoints.length > 2 && (
                          <span className="endpoint-badge endpoint-more">
                            +{api.endpoints.length - 2}
                          </span>
                        )}
                      </div>
                    </span>
                  </div>
                </div>

                <div className="api-card-footer">
                  <div className="price-display">
                    <div className="price-label">Price</div>
                    <div className="price-value">
                      {api.pricing.enabled ? `$${api.pricing.cost_per_request}` : "Free"}
                    </div>
                  </div>
                  <button className="view-details-button">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h.01" />
                <path d="M17 7h.01" />
                <path d="M7 17h.01" />
                <path d="M17 17h.01" />
                <path d="M12 12h.01" />
              </svg>
            </div>
            {viewMode === "all" ? (
              <>
                <h2 className="empty-title">No APIs in the marketplace yet</h2>
                <p className="empty-description">Be the first to create an API!</p>
              </>
            ) : (
              <>
                <h2 className="empty-title">You haven't created any APIs yet</h2>
                <p className="empty-description">Click the "Create API" button to get started</p>
              </>
            )}
            <Button onClick={() => setIsCreateOpen(true)} className="create-api-button mt-8 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create API
            </Button>
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="api-dialog max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedAPI && (
            <>
              <DialogHeader>
                <DialogTitle className="api-dialog-title">
                  {selectedAPI.name}
                </DialogTitle>
                <DialogDescription className="api-dialog-description">
                  {selectedAPI.description || "No description provided."}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="api-dialog-tabs">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="api-dialog-panel">
                  <div className="api-dialog-item">
                    <h3>Base URL</h3>
                        <div className="api-dialog-copy-row">
                          <code>{selectedAPI.base_url}</code>
                          <button
                            type="button"
                            className="copy-chip"
                            onClick={() => handleCopy('Base URL', selectedAPI.base_url)}
                            aria-label="Copy base URL"
                          >
                            <CopyIcon className="copy-icon" />
                          </button>
                        </div>
                  </div>
                  <div className="api-dialog-item">
                    <h3>Description</h3>
                    <p>{selectedAPI.description || "No description provided."}</p>
                  </div>
                </TabsContent>

                <TabsContent value="endpoints" className="api-dialog-panel">
                  {selectedAPI.endpoints.map((endpoint, idx) => (
                    <Card key={idx} className="api-dialog-endpoint">
                      <div className="api-dialog-endpoint-header">
                        <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                        <code>{endpoint.path}</code>
                      </div>

                      {endpoint.headers && (
                        <div className="api-dialog-endpoint-section">
                          <p>Headers</p>
                          <pre>{JSON.stringify(endpoint.headers, null, 2)}</pre>
                        </div>
                      )}

                      {endpoint.body_schema && (
                        <div className="api-dialog-endpoint-section">
                          <p>Request Body Schema</p>
                          <pre>{JSON.stringify(endpoint.body_schema, null, 2)}</pre>
                        </div>
                      )}

                      {endpoint.query_params && (
                        <div className="api-dialog-endpoint-section">
                          <p>Query Parameters</p>
                          <pre>{JSON.stringify(endpoint.query_params, null, 2)}</pre>
                        </div>
                      )}
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="pricing" className="api-dialog-panel">
                  {selectedAPI.pricing.enabled ? (
                    <div className="api-dialog-pricing">
                      <div>
                        <h3>Cost Per Request</h3>
                        <p className="api-dialog-price">
                          ${selectedAPI.pricing.cost_per_request}
                        </p>
                      </div>
                      <div>
                        <h3>Solana Public Key</h3>
                        <div className="api-dialog-copy-row">
                          <code>{selectedAPI.pricing.sol_public_key}</code>
                          <button
                            type="button"
                            className="copy-chip"
                            onClick={() => handleCopy('Solana public key', selectedAPI.pricing.sol_public_key)}
                            aria-label="Copy Solana public key"
                          >
                            <CopyIcon className="copy-icon" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="api-dialog-muted">This API is free to use.</p>
                  )}
                </TabsContent>

                <TabsContent value="info" className="api-dialog-panel">
                  <div className="api-dialog-meta">
                    <div>
                      <p>API ID</p>
                      <div className="api-dialog-copy-row">
                        <code>{selectedAPI.id}</code>
                        <button
                          type="button"
                          className="copy-chip"
                          onClick={() => handleCopy('API ID', selectedAPI.id)}
                          aria-label="Copy API ID"
                        >
                          <CopyIcon className="copy-icon" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p>Owner ID</p>
                      <div className="api-dialog-copy-row">
                        <code>{selectedAPI.owner_id}</code>
                        <button
                          type="button"
                          className="copy-chip"
                          onClick={() => handleCopy('Owner ID', selectedAPI.owner_id)}
                          aria-label="Copy owner ID"
                        >
                          <CopyIcon className="copy-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="api-dialog-meta">
                    <div>
                      <p>Created</p>
                      <span>{selectedAPI.created_at}</span>
                    </div>
                    <div>
                      <p>Updated</p>
                      <span>{selectedAPI.updated_at}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="api-create-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="api-create-header">
            <div className="api-create-step">Step {createStep} of 3</div>
            <DialogTitle className="api-create-title">Create a new API</DialogTitle>
            <DialogDescription className="api-create-subtitle">
              Capture the essential details, wire up endpoints, and configure pricing before publishing.
            </DialogDescription>
          </DialogHeader>

          <div className="api-create-content">
            {createStep === 1 && (
              <div className="api-create-panel">
                <div className="api-create-card">
                  <h3 className="api-create-card-title">API overview</h3>
                  <p className="api-create-card-subtitle">
                    Provide a concise snapshot so builders instantly understand what your API offers.
                  </p>

                  <div className="api-create-fields">
                    <label className="api-create-field">
                      <span>API name</span>
                      <Input
                        placeholder="e.g., JSONPlaceholder API"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="api-create-input"
                      />
                    </label>
                    <label className="api-create-field">
                      <span>Description</span>
                      <Input
                        placeholder="e.g., Fake REST API for testing"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="api-create-input"
                      />
                    </label>
                    <label className="api-create-field">
                      <span>Base URL</span>
                      <Input
                        placeholder="e.g., https://jsonplaceholder.typicode.com"
                        value={formData.base_url}
                        onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                        className="api-create-input"
                      />
                    </label>
                    <label className="api-create-field">
                      <span>Category</span>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="api-create-select"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="api-create-actions">
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setCreateStep(2)}
                    disabled={!formData.name || !formData.description || !formData.base_url}
                    className="api-create-primary"
                  >
                    Continue to endpoints
                  </Button>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="api-create-panel">
                <div className="api-create-card">
                  <h3 className="api-create-card-title">Endpoints</h3>
                  <p className="api-create-card-subtitle">
                    Outline the primary routes. You can always extend these after the initial setup.
                  </p>

                  <div className="api-create-endpoint-editor">
                    <div className="api-create-endpoint-grid">
                      <label className="api-create-field">
                        <span>Path</span>
                        <Input
                          placeholder="/posts"
                          value={currentEndpoint.path}
                          onChange={(e) => setCurrentEndpoint({ ...currentEndpoint, path: e.target.value })}
                          className="api-create-input"
                        />
                      </label>
                      <label className="api-create-field">
                        <span>Method</span>
                        <select
                          value={currentEndpoint.method}
                          onChange={(e) =>
                            setCurrentEndpoint({
                              ...currentEndpoint,
                              method: e.target.value,
                            })
                          }
                          className="api-create-select"
                        >
                          <option>GET</option>
                          <option>POST</option>
                          <option>PUT</option>
                          <option>DELETE</option>
                          <option>PATCH</option>
                        </select>
                      </label>
                    </div>

                    <label className="api-create-field">
                      <span>Headers (JSON)</span>
                      <Input
                        placeholder='{"Content-Type": "application/json"}'
                        value={currentEndpoint.headers ? JSON.stringify(currentEndpoint.headers) : ""}
                        onChange={(e) => {
                          try {
                            setCurrentEndpoint({
                              ...currentEndpoint,
                              headers: e.target.value ? JSON.parse(e.target.value) : null,
                            })
                          } catch {}
                        }}
                        className="api-create-input api-create-input-mono"
                      />
                    </label>

                    <label className="api-create-field">
                      <span>Body schema (JSON)</span>
                      <Input
                        placeholder='{"type": "object", "properties": {...}}'
                        value={currentEndpoint.body_schema ? JSON.stringify(currentEndpoint.body_schema) : ""}
                        onChange={(e) => {
                          try {
                            setCurrentEndpoint({
                              ...currentEndpoint,
                              body_schema: e.target.value ? JSON.parse(e.target.value) : null,
                            })
                          } catch {}
                        }}
                        className="api-create-input api-create-input-mono"
                      />
                    </label>

                    <label className="api-create-field">
                      <span>Query params (JSON)</span>
                      <Input
                        placeholder='{"q": "search query"}'
                        value={currentEndpoint.query_params ? JSON.stringify(currentEndpoint.query_params) : ""}
                        onChange={(e) => {
                          try {
                            setCurrentEndpoint({
                              ...currentEndpoint,
                              query_params: e.target.value ? JSON.parse(e.target.value) : null,
                            })
                          } catch {}
                        }}
                        className="api-create-input api-create-input-mono"
                      />
                    </label>

                    <Button
                      onClick={handleAddEndpoint}
                      className="api-create-secondary"
                      disabled={!currentEndpoint.path}
                    >
                      Add endpoint
                    </Button>
                  </div>

                  {formData.endpoints.length > 0 && (
                    <div className="api-create-endpoint-list">
                      <p className="api-create-list-title">
                        Added endpoints <span>({formData.endpoints.length})</span>
                      </p>
                      {formData.endpoints.map((endpoint, idx) => (
                        <div key={idx} className="api-create-endpoint-item">
                          <div className="api-create-endpoint-meta">
                            <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                            <code>{endpoint.path}</code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEndpoint(idx)}
                            className="api-create-delete"
                            aria-label={`Remove endpoint ${endpoint.path}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="api-create-actions">
                  <Button variant="ghost" onClick={() => setCreateStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setCreateStep(3)} className="api-create-primary">
                    Review pricing
                  </Button>
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div className="api-create-panel">
                <div className="api-create-card">
                  <h3 className="api-create-card-title">Pricing</h3>
                  <p className="api-create-card-subtitle">
                    Monetize with Solana billing or keep things free while you build traction.
                  </p>

                  <label className="api-create-paid-toggle">
                    <input
                      type="checkbox"
                      checked={formData.pricing.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, enabled: e.target.checked },
                        })
                      }
                    />
                    <span>Enable paid API access</span>
                  </label>

                  {formData.pricing.enabled && (
                    <div className="api-create-fields">
                      <label className="api-create-field">
                        <span>Cost per request (USD)</span>
                        <Input
                          type="number"
                          placeholder="0.05"
                          value={formData.pricing.cost_per_request}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricing: {
                                ...formData.pricing,
                                cost_per_request: Number.parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          step="0.001"
                          className="api-create-input"
                        />
                      </label>

                      <label className="api-create-field">
                        <span>Solana public key</span>
                        <Input
                          placeholder="8hAVK73RZdtyP2kE82ohAsAGgKaxffS6pU7B9bxRg2RL"
                          value={formData.pricing.sol_public_key}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricing: { ...formData.pricing, sol_public_key: e.target.value },
                            })
                          }
                          className="api-create-input api-create-input-mono"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="api-create-actions">
                  <Button variant="ghost" onClick={() => setCreateStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleCreateSubmit} className="api-create-primary">
                    Create API
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    )
}
