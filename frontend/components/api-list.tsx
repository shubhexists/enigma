"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  listUserApis,
  listAllApis,
  createApi,
  type Api as BackendApi,
  type CreateApiRequest,
  type ApiCategory
} from "@/lib/api-client"

interface Endpoint {
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
  headers?: Record<string, any>
  body_schema?: Record<string, any>
  query_params?: Record<string, any>
}

interface API {
  id: string
  owner_id: string
  name: string
  description: string
  base_url: string
  endpoints: Endpoint[]
  pricing: {
    enabled: boolean
    sol_public_key: string
    cost_per_request: number
  }
  created_at: string
  updated_at: string
  category: string
}

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

const getMethodColor = (method: string) => {
  switch (method) {
    case "GET":
      return "bg-blue-100 text-blue-800"
    case "POST":
      return "bg-green-100 text-green-800"
    case "PUT":
      return "bg-yellow-100 text-yellow-800"
    case "DELETE":
      return "bg-red-100 text-red-800"
    case "PATCH":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

interface CreateAPIFormState {
  name: string
  description: string
  base_url: string
  category: string
  endpoints: Endpoint[]
  pricing: {
    enabled: boolean
    sol_public_key: string
    cost_per_request: number
  }
}

interface APIListProps {
  userId: string
}

export function APIList({ userId }: APIListProps) {
  const [apis, setApis] = useState<API[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAPI, setSelectedAPI] = useState<API | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"all" | "user">("all")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [formData, setFormData] = useState<CreateAPIFormState>({
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
  const [currentEndpoint, setCurrentEndpoint] = useState<Endpoint>({
    path: "",
    method: "GET",
    headers: undefined,
    body_schema: undefined,
    query_params: undefined,
  })

  useEffect(() => {
    const loadApis = async () => {
      try {
        setLoading(true)
        
        let fetchedApis: BackendApi[] = []
        
        try {
          if (viewMode === "all") {
            try {
              const userApis = await listUserApis(userId)
              
              fetchedApis = await listAllApis()
              
              if (fetchedApis.length === 0 && userApis.length > 0) {
                toast.warning('Marketplace API issue detected', {
                  description: 'Using your APIs as a temporary fallback'
                })
                fetchedApis = userApis
              }
            } catch (error) {
              fetchedApis = await listUserApis(userId)
            }
          } else {
            fetchedApis = await listUserApis(userId)
          }
          
        } catch (apiError: any) {
          toast.error('Error loading APIs', {
            description: apiError?.message || 'Please try refreshing the page'
          })
          
          fetchedApis = []
        }
        
        if (!Array.isArray(fetchedApis)) {
          fetchedApis = []
        }
        
        const converted = fetchedApis.map((api: BackendApi) => ({
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
      } catch (error: any) {
        toast.error('Error loading APIs', {
          description: error?.message || 'Please try refreshing the page'
        })
        
        setApis([])
      } finally {
        setLoading(false)
      }
    }

    loadApis()
  }, [userId, viewMode])

  const filteredAPIs = useMemo(() => {
    return apis.filter((api) => {
      const matchesSearch =
        api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || api.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [apis, searchQuery, selectedCategory])

  const handleAPIClick = (api: API) => {
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
    
    const endpoint: Endpoint = {
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

  const handleRemoveEndpoint = (index: number) => {
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

      const request: CreateApiRequest = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category as ApiCategory, 
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
        
      const newApi: API = {
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
    } catch (error: any) {
      toast.error("API Creation Failed", {
        description: error?.message || "Please check your inputs and try again"
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">API Marketplace</h1>
            <p className="text-sm text-muted-foreground">Browse and explore available APIs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted rounded-lg p-0.5">
              <Button 
                variant={viewMode === "all" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("all")}
                className={`text-xs rounded-md ${viewMode === "all" ? "" : "bg-transparent"}`}
              >
                All APIs
              </Button>
              <Button 
                variant={viewMode === "user" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("user")}
                className={`text-xs rounded-md ${viewMode === "user" ? "" : "bg-transparent"}`}
              >
                My APIs
              </Button>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create API
            </Button>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search APIs by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-xs h-8"
            >
              All Categories
            </Button>
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs h-8"
              >
                {category}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filteredAPIs.length} of {apis.length} {viewMode === "all" ? "APIs in marketplace" : "of your APIs"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Loading APIs...</p>
          </div>
        ) : filteredAPIs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAPIs.map((api) => (
              <Card
                key={api.id}
                className="p-2 cursor-pointer hover:shadow-md transition-shadow border border-border"
                onClick={() => handleAPIClick(api)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-foreground truncate">{api.name}</h2>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {api.category}
                      </Badge>
                      {viewMode === "all" && api.owner_id === userId && (
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          Your API
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{api.description}</p>

                <div className="space-y-1">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Base URL</p>
                    <p className="text-xs text-foreground truncate font-mono">{api.base_url}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Endpoints</p>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {api.endpoints.slice(0, 2).map((endpoint, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {endpoint.method}
                          </Badge>
                        ))}
                        {api.endpoints.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{api.endpoints.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {api.pricing.enabled && (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-muted-foreground">Price</p>
                        <p className="text-xs text-foreground">${api.pricing.cost_per_request}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button className="w-full mt-2 bg-transparent text-xs h-7" variant="outline">
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground">
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
                <p className="text-lg font-semibold">No APIs in the marketplace yet</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to create an API!</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">You haven't created any APIs yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click the "Create API" button to get started</p>
              </>
            )}
            <Button onClick={() => setIsCreateOpen(true)} className="mt-6 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create API
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAPI && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedAPI.name}</DialogTitle>
                <DialogDescription>{selectedAPI.description}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Base URL</h3>
                    <code className="block bg-muted p-3 rounded text-sm text-foreground font-mono">
                      {selectedAPI.base_url}
                    </code>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{selectedAPI.description}</p>
                  </div>
                </TabsContent>

                <TabsContent value="endpoints" className="space-y-4">
                  {selectedAPI.endpoints.map((endpoint, idx) => (
                    <Card key={idx} className="p-4 border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                        <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                      </div>

                      {endpoint.headers && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Headers</p>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto text-foreground">
                            {JSON.stringify(endpoint.headers, null, 2)}
                          </pre>
                        </div>
                      )}

                      {endpoint.body_schema && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Request Body Schema</p>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto text-foreground">
                            {JSON.stringify(endpoint.body_schema, null, 2)}
                          </pre>
                        </div>
                      )}

                      {endpoint.query_params && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Query Parameters</p>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto text-foreground">
                            {JSON.stringify(endpoint.query_params, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  {selectedAPI.pricing.enabled ? (
                    <>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Cost Per Request</h3>
                        <p className="text-2xl font-bold text-primary">${selectedAPI.pricing.cost_per_request}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Solana Public Key</h3>
                        <code className="block bg-muted p-3 rounded text-xs text-foreground font-mono break-all">
                          {selectedAPI.pricing.sol_public_key}
                        </code>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">This API is free to use.</p>
                  )}
                </TabsContent>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">API ID</p>
                      <p className="text-sm text-foreground font-mono break-all">{selectedAPI.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Owner ID</p>
                      <p className="text-sm text-foreground font-mono break-all">{selectedAPI.owner_id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Created</p>
                      <p className="text-sm text-foreground">{selectedAPI.created_at}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Updated</p>
                      <p className="text-sm text-foreground">{selectedAPI.updated_at}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New API</DialogTitle>
            <DialogDescription>Step {createStep} of 3</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">API Name</label>
                  <Input
                    placeholder="e.g., JSONPlaceholder API"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Description</label>
                  <Input
                    placeholder="e.g., Fake REST API for testing"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Base URL</label>
                  <Input
                    placeholder="e.g., https://jsonplaceholder.typicode.com"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-9 px-3 rounded border border-input bg-background text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setCreateStep(2)}
                    disabled={!formData.name || !formData.description || !formData.base_url}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Add Endpoints</h3>

                  <div className="space-y-3 mb-4 p-4 border border-border rounded">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Path</label>
                        <Input
                          placeholder="/posts"
                          value={currentEndpoint.path}
                          onChange={(e) => setCurrentEndpoint({ ...currentEndpoint, path: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Method</label>
                        <select
                          value={currentEndpoint.method}
                          onChange={(e) =>
                            setCurrentEndpoint({
                              ...currentEndpoint,
                              method: e.target.value as Endpoint["method"],
                            })
                          }
                          className="w-full h-8 px-2 rounded border border-input bg-background text-sm"
                        >
                          <option>GET</option>
                          <option>POST</option>
                          <option>PUT</option>
                          <option>DELETE</option>
                          <option>PATCH</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Headers (JSON)</label>
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
                        className="h-8 text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        Body Schema (JSON)
                      </label>
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
                        className="h-8 text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        Query Params (JSON)
                      </label>
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
                        className="h-8 text-sm font-mono"
                      />
                    </div>

                    <Button
                      onClick={handleAddEndpoint}
                      size="sm"
                      className="w-full h-8 text-sm"
                      disabled={!currentEndpoint.path}
                    >
                      Add Endpoint
                    </Button>
                  </div>

                  {formData.endpoints.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Added Endpoints ({formData.endpoints.length})
                      </p>
                      {formData.endpoints.map((endpoint, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <div className="flex items-center gap-2">
                            <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                            <code className="text-xs font-mono">{endpoint.path}</code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEndpoint(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => setCreateStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setCreateStep(3)}>Next</Button>
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.pricing.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-semibold text-foreground">Enable Paid API</label>
                </div>

                {formData.pricing.enabled && (
                  <div className="space-y-4 p-4 border border-border rounded">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">Cost Per Request ($)</label>
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
                        className="h-9"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">Solana Public Key</label>
                      <Input
                        placeholder="8hAVK73RZdtyP2kE82ohAsAGgKaxffS6pU7B9bxRg2RL"
                        value={formData.pricing.sol_public_key}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, sol_public_key: e.target.value },
                          })
                        }
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => setCreateStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleCreateSubmit} className="bg-green-600 hover:bg-green-700">
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
