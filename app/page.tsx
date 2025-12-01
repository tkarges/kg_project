"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Image from "next/image"

export const RELATION_OPTIONS: Record<
  string,
  { value: string; label: string }
> = {
  hasECTS: {
    value: "hasECTS",
    label: "ECTS",
  },
  hasLevel: {
    value: "hasLevel",
    label: "Level",
  },
  taughtBy: {
    value: "taughtBy",
    label: "Lecturer",
  },
  hasType: {
    value: "hasType",
    label: "Type",
  },
  offeredIn: {
    value: "offeredIn",
    label: "Offering",
  },
  hasLanguage: {
    value: "hasLanguage",
    label: "Language",
  },
};

type ModuleItem = {
  subject: string;
  description?: string;
};

type ModuleFilterResponse = {
  results: ModuleItem[];
};

type RelationRangeItem = {
  module_name: string;
};

type RelationRangeResponse = {
  results: RelationRangeItem[];
};

type ModuleDomainItem = {
  module_name: string;
}

type ModuleDomainResponse = {
  results: ModuleDomainItem[];
}

export default function KnowledgeGraphQuery() {
  const [darkMode, setDarkMode] = useState(false);
  const [subject, setSubject] = useState("");
  const [relation, setRelation] = useState("");
  const [object, setObject] = useState("");
  const [results, setResults] = useState<Array<Record<string, string>>>([]);
  const [objectRelationRange, setObjectRelationRange] = useState<RelationRangeItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("programs");
  const [subjectDisplay, setSubjectDisplay] = useState<string>();
  const [subjectModuleDomain, setSubjectModuleDomain] = useState<ModuleDomainItem[]>([]);

  useEffect(() => {
    setObject("");
  }, [relation]);

  const handleModuleQuery = async () => {
    try {
      const res = await fetch("https://kgbackend.vercel.app/api/module-filter/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "module": subject,
        })
      });
      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }
      const data: ModuleFilterResponse = await res.json();
      setResults(data.results);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFilterQuery = async () => {
    try {
      console.log("Calling /api/object-relation with", { relation, object });

      const res = await fetch("https://kgbackend.vercel.app/api/object-relation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          'obj': object,
          'relation': relation,
        }),
      });

      const data = await res.json();
      console.log("Response from backend:", res.status, data);

      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }

      setResults(data.results);
    } catch (err: any) {
      console.error("Filter query failed:", err);
      alert(err.message ?? "Unknown error");
    }
  };

  const handlePropertyQuery = async () => {
    try {
      console.log("Calling /api/module-property with", { relation, subject });

      const res = await fetch("https://kgbackend.vercel.app/api/module-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          'module':subject,
          'relation': relation,
        }),
      });

      const data = await res.json();
      console.log("Response from backend:", res.status, data);

      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }

      setResults(data.results);
    } catch (err: any) {
      console.error("Filter query failed:", err);
      alert(err.message ?? "Unknown error");
    }
  };

  const getRelationRange = async (relation: string) => {
    try {
      setRelation(relation)
      console.log("Calling api/object-relation/relation-ranges with", { relation });

      const res = await fetch("https://kgbackend.vercel.app/api/object-relation/relation-ranges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          'relation': relation,
        }),
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }

      const data: RelationRangeResponse = await res.json();
      setObjectRelationRange(data.results);
      console.log("Response from backend:", res.status, data);

    } catch (err: any) {
      console.error("Filter query failed:", err);
      alert(err.message ?? "Unknown error");
    }
  };

  const getModuleDomains = async () => {
    try {
      console.log("Calling api/module-property/module-domains with", {});

      const res = await fetch("https://kgbackend.vercel.app/api/module-property/module-domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        }),
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }

      const data: ModuleDomainResponse = await res.json();
      setSubjectModuleDomain(data.results);
      console.log("Response from backend:", res.status, data);

    } catch (err: any) {
      console.error("Filter query failed:", err);
      alert(err.message ?? "Unknown error");
    }
  };

  return (
    <div
      className={`min-h-screen px-6 py-10 transition-colors duration-300 ${darkMode ? "bg-slate-950" : "bg-white"
        }`}
    >
      <div className="mx-auto max-w-7xl">
        <header className="relative flex items-center justify-center mb-12">
          <div className="text-center px-4">
            <h1
              className={`text-4xl sm:text-5xl font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"
                }`}
            >
              Module Catalogues
            </h1>
            <p
              className={`mt-3 text-lg ${darkMode ? "text-slate-300" : "text-slate-600"
                }`}
            >
              Faculty of Business Informatics & Mathematics
            </p>
          </div>

          
          <div className="absolute right-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className={`h-12 w-12 rounded-full transition ${darkMode
                ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                : "border-slate-300 bg-white hover:bg-slate-100 opacity-0"
                }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-6 w-6" />
              ) : (
                <Moon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </header>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={darkMode ? "border-slate-700" : ""}>
                Select Tab
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={darkMode ? "bg-slate-800 border-slate-700" : ""}>
              <DropdownMenuLabel>Selection of Tasks</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTab("programs");
                }}
              >
                Available Modules for Study Programs
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTab("modules")
                }}
              >
                Filter Modules
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTab("main");
                  getModuleDomains();
                }}
              >
                Module Property Filter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {
          selectedTab === "programs" && (
            <Card className={`shadow-lg mt-6 ${darkMode ? "bg-slate-800 border-slate-700" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                    Available Modules by Study Program
                  </h2>
                  <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} text-sm`}>
                    Choose a study program and run the query to see its modules.
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`${darkMode ? "border-slate-700 text-slate-100" : ""} w-fit`}
                    >
                      {subjectDisplay || "Select Study Program"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={darkMode ? "bg-slate-800 border-slate-700" : ""}
                  >
                    <DropdownMenuLabel>Selection of Study Programs</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSubject("M.Sc.[WS]Mannheim[WS]Master[WS]in[WS]Data[WS]Science");
                        setSubjectDisplay("MMDS");
                      }}
                    >
                      MMDS
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSubject("B.Sc.[WS]Wirtschaftsinformatik");
                        setSubjectDisplay("B.Sc. Business Informatics");
                      }}
                    >
                      B.Sc. Business Informatics
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSubject("M.Sc.[WS]Wirtschaftsinformatik");
                        setSubjectDisplay("M.Sc. Business Informatics");
                      }}
                    >
                      M.Sc. Business Informatics
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSubject("B.Sc.[WS]Wirtschaftsmathematik");
                        setSubjectDisplay("B.Sc. Mathematics in Business and Economics");
                      }}
                    >
                      B.Sc. Mathematics in Business and Economics
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSubject("M.Sc.[WS]Wirtschaftsinformatik");
                        setSubjectDisplay("M.Sc. Mathematics in Business and Economics");
                      }}
                    >
                      M.Sc. Mathematics in Business and Economics
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="space-y-6">
                {subjectDisplay && (
                  <div className={darkMode ? "text-slate-200" : "text-slate-800"}>
                    <span className="text-sm text-slate-500">Selected program:</span>{" "}
                    <span className="font-semibold">{subjectDisplay}</span>
                  </div>
                )}

                <Button
                  className="w-fit bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleModuleQuery}
                  disabled={!subject}
                >
                  Show Available Modules
                </Button>

                <div
                  className={`rounded-lg border overflow-hidden ${darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                >
                  <Table>
                    <TableHeader>
                      <TableRow
                        className={
                          darkMode
                            ? "bg-slate-700 hover:bg-slate-700 border-slate-600"
                            : "bg-slate-100 hover:bg-slate-100"
                        }
                      >
                        <TableHead
                          className={`font-semibold text-base h-14 ${darkMode ? "text-white" : "text-slate-900"
                            }`}
                        >
                          Module Name
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length > 0 ? (
                        results.map((row, index) => (
                          <TableRow
                            key={index}
                            className={`h-16 ${darkMode ? "border-slate-700" : ""}`}
                          >
                            <TableCell
                              className={`text-base ${darkMode ? "text-slate-100" : "text-slate-900"
                                }`}
                            >
                              {row.module_name}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className={darkMode ? "border-slate-700" : ""}>
                          <TableCell
                            colSpan={1}
                            className={`text-center h-32 ${darkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                          >
                            No results yet. Choose a program and run the query to see modules.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        }
        {
          selectedTab === "modules" && (
            <Card className={`shadow-lg mt-6 ${darkMode ? "bg-slate-800 border-slate-700" : ""}`}>
              <CardHeader>
                <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  Find Modules by Relation & Object
                </h2>
                <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} text-sm`}>
                  Choose a relation and an object to retrieve suitable modules from the knowledge graph.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="relation-select"
                      className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
                    >
                      Relation
                    </Label>

                    <Select value={relation} onValueChange={(value) => {
                      getRelationRange(value);
                    }}>
                      <SelectTrigger
                        id="relation-select"
                        className={`h-12 w-full ${darkMode ? "bg-slate-700 border-slate-600 text-white" : ""
                          }`}
                      >
                        <SelectValue placeholder="Select relation..." />
                      </SelectTrigger>
                      <SelectContent className={darkMode ? "bg-slate-700 border-slate-600" : ""}>
                        {Object.values(RELATION_OPTIONS).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Object dropdown */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="object-select"
                      className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
                    >
                      Object
                    </Label>

                    <Select
                      value={object}
                      onValueChange={setObject}
                      disabled={!relation}
                    >
                      <SelectTrigger
                        id="object-select"
                        className={`h-12 w-full ${darkMode ? "bg-slate-700 border-slate-600 text-white" : ""
                          } ${!relation ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <SelectValue
                          placeholder={relation ? "Select object..." : "Select a relation first"}
                        />
                      </SelectTrigger>
                      <SelectContent className={darkMode ? "bg-slate-700 border-slate-600" : ""}>
                        <SelectContent className={darkMode ? "bg-slate-700 border-slate-600" : ""}>
                          {objectRelationRange
                            .filter((row) => row.module_name && row.module_name.trim() !== "")
                            .map((row) => (
                              <SelectItem key={row.module_name} value={row.module_name}>
                                {row.module_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
                <Button
                  className="w-fit bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleFilterQuery}
                  disabled={!relation || !object}
                >
                  Show Suitable Modules
                </Button>
                <div
                  className={`rounded-lg border overflow-hidden ${darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                >
                  <Table>
                    <TableHeader>
                      <TableRow
                        className={
                          darkMode
                            ? "bg-slate-700 hover:bg-slate-700 border-slate-600"
                            : "bg-slate-100 hover:bg-slate-100"
                        }
                      >
                        <TableHead
                          className={`font-semibold text-base h-14 ${darkMode ? "text-white" : "text-slate-900"
                            }`}
                        >
                          Module Name
                        </TableHead>
                        <TableHead
                          className={`font-semibold text-base h-14 ${darkMode ? "text-white" : "text-slate-900"
                            }`}
                        >
                          Description
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length > 0 ? (
                        results.map((row, index) => (
                          <TableRow
                            key={index}
                            className={`h-16 ${darkMode ? "border-slate-700" : ""}`}
                          >
                            <TableCell
                              className={`text-base ${darkMode ? "text-slate-100" : "text-slate-900"
                                }`}
                            >
                              {row.module_name}
                            </TableCell>
                            <TableCell
                              className={`text-base ${darkMode ? "text-slate-100" : "text-slate-900"
                                }`}
                            >
                              {row.description}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className={darkMode ? "border-slate-700" : ""}>
                          <TableCell
                            colSpan={2}
                            className={`text-center h-32 ${darkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                          >
                            No results yet. Choose a relation and object, then run the query.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        }

        {
          selectedTab === "main" && (
            <Card className={`shadow-lg mt-6 ${darkMode ? "bg-slate-800 border-slate-700" : ""}`}>
              <CardHeader>
                <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  Find Modules by Relation & Object
                </h2>
                <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} text-sm`}>
                  Choose a module and a relation to view the module's properties.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="module-select"
                      className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
                    >
                      Module
                    </Label>

                    <Select
                      value={subject}
                      onValueChange={setSubject}
                    >
                      <SelectTrigger
                        id="subject-select"
                        className={`h-12 w-full ${darkMode ? "bg-slate-700 border-slate-600 text-white" : ""
                          }`}
                      >
                        <SelectValue
                          placeholder={"Select a module"}
                        />
                      </SelectTrigger>
                      <SelectContent className={darkMode ? "bg-slate-700 border-slate-600" : ""}>
                        <SelectContent className={darkMode ? "bg-slate-700 border-slate-600" : ""}>
                          {subjectModuleDomain
                            .filter((row) => row.module_name && row.module_name.trim() !== "")
                            .map((row) => (
                              <SelectItem key={row.module_name} value={row.module_name}>
                                {row.module_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="relation-select"
                      className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
                    >
                      Relation
                    </Label>

                    <Select value={relation} onValueChange={(value) => {
                      setRelation(value)
                    }}>
                      <SelectTrigger
                        id="relation-select"
                        className={`h-12 w-full ${darkMode ? "bg-slate-700 border-slate-600 text-white" : ""
                          }`}
                      >
                        <SelectValue placeholder="Select relation..." />
                      </SelectTrigger>
                      <SelectContent className={darkMode ? "bg-slate-700 border-slate-600" : ""}>
                        {Object.values(RELATION_OPTIONS).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                </div>
                <Button
                  className="w-fit bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handlePropertyQuery}
                  disabled={!relation || !subject}
                >
                  Show Selected Property
                </Button>
                <div
                  className={`rounded-lg border overflow-hidden ${darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                >
                  <Table>
                    <TableHeader>
                      <TableRow
                        className={
                          darkMode
                            ? "bg-slate-700 hover:bg-slate-700 border-slate-600"
                            : "bg-slate-100 hover:bg-slate-100"
                        }
                      >
                        <TableHead
                          className={`font-semibold text-base h-14 ${darkMode ? "text-white" : "text-slate-900"
                            }`}
                        >
                          Module Name
                        </TableHead>
                        <TableHead
                          className={`font-semibold text-base h-14 ${darkMode ? "text-white" : "text-slate-900"
                            }`}
                        >
                          Property Values
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length > 0 ? (
                        results.map((row, index) => (
                          <TableRow
                            key={index}
                            className={`h-16 ${darkMode ? "border-slate-700" : ""}`}
                          >
                            <TableCell
                              className={`text-base ${darkMode ? "text-slate-100" : "text-slate-900"
                                }`}
                            >
                              {subject}
                            </TableCell>
                            <TableCell
                              className={`text-base ${darkMode ? "text-slate-100" : "text-slate-900"
                                }`}
                            >
                              {row.module_property}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className={darkMode ? "border-slate-700" : ""}>
                          <TableCell
                            colSpan={2}
                            className={`text-center h-32 ${darkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                          >
                            No results yet. Choose a relation and object, then run the query.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        }
      </div >
    </div>
  )
}
