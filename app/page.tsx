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

const OBJECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  ects: [
    { value: "3", label: "3 ECTS" },
    { value: "4", label: "4 ECTS" },
    { value: "6", label: "6 ECTS" },
    { value: "8", label: "8 ECTS" },
    { value: "9", label: "9 ECTS" },
    { value: "12", label: "12 ECTS" },
  ],
  level: [
    { value: "Bachelor", label: "Bachelor" },
    { value: "Master", label: "Master" },
  ],
  lecturer: [
    { value: "Prof.[WS]Dr.[WS]Rainer[WS]Gemulla", label: "Prof. Dr. Rainer Gemulla" },
    { value: "Dr.[WS]Sven[WS]Hertling", label: "Dr. Sven Hertling" },
  ],
};

export default function KnowledgeGraphQuery() {
  const [darkMode, setDarkMode] = useState(false);
  const [subject, setSubject] = useState("");
  const [relation, setRelation] = useState("");
  const [object, setObject] = useState("");
  const [results, setResults] = useState<Array<Record<string, string>>>([]);
  const [selectedTab, setSelectedTab] = useState<string>("programs");
  const [subjectDisplay, setSubjectDisplay] = useState<string>();

  useEffect(() => {
    setObject("");
  }, [relation]);

  const handleModuleQuery = async () => {
    try {
      const res = await fetch("/api/query_execution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
        })
      });
      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFilterQuery = async () => {
    try {
      const res = await fetch("/api/module_filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          object,
          relation,
        })
      });
      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error(err);
    }
  }

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1" />
          <h1 className={`text-3xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Knowledge Graph Query Interface
          </h1>
          <div className="flex-1 flex justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className={darkMode ? 'border-slate-700 hover:bg-slate-800' : ''}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
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
                  setSelectedTab("programs")
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
                  setSelectedTab("main")
                }}
              >
                Main Menu (Original UI)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Main Query Card */}
        {selectedTab === "programs" && (
          <Card className={`shadow-lg ${darkMode ? "bg-slate-800 border-slate-700" : ""}`}>
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
                            {row.subject}
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
        )}
        {selectedTab === "modules" && (
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
              {/* Relation & Object dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Relation dropdown */}
                <div className="space-y-2">
                  <Label
                    htmlFor="relation-select"
                    className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
                  >
                    Relation
                  </Label>

                  <Select value={relation} onValueChange={setRelation}>
                    <SelectTrigger
                      id="relation-select"
                      className={`h-12 w-full ${darkMode ? "bg-slate-700 border-slate-600 text-white" : ""
                        }`}
                    >
                      <SelectValue placeholder="Select relation..." />
                    </SelectTrigger>
                    <SelectContent className={darkMode ? "bg-slate-700 border-slate-600" : ""}>
                      <SelectItem value="ects">ECTS</SelectItem>
                      <SelectItem value="level">Level</SelectItem>
                      <SelectItem value="lecturer">Lecturer</SelectItem>
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
                      {(OBJECT_OPTIONS[relation] ?? []).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
              {/* Run query button */}
              <Button
                className="w-fit bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleFilterQuery}
                disabled={!relation || !object}
              >
                Show Suitable Modules
              </Button>

              {/* Results table */}
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
                            {row.subject}
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
        )}

        {selectedTab === 'main' && (
          <Card className={`shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : ''}`}>
            <CardContent className="p-8">
              {/* Query Input Fields */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
                {/* Subject Field */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`h-12 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                    placeholder="Enter subject..."
                  />
                </div>

                {/* Relation Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="relation" className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Relation
                  </Label>
                  <Select value={relation} onValueChange={setRelation}>
                    <SelectTrigger id="relation" className={`h-12 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}>
                      <SelectValue placeholder="Select relation..." />
                    </SelectTrigger>
                    <SelectContent className={darkMode ? 'bg-slate-700 border-slate-600' : ''}>
                      <SelectItem value="offering" className={darkMode ? 'text-white focus:bg-slate-600' : ''}>offering</SelectItem>
                      <SelectItem value="required" className={darkMode ? 'text-white focus:bg-slate-600' : ''}>required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Object Field */}
                <div className="space-y-2">
                  <Label htmlFor="object" className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Object
                  </Label>
                  <Input
                    id="object"
                    value={object}
                    onChange={(e) => setObject(e.target.value)}
                    className={`h-12 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                    placeholder="Enter object..."
                  />
                </div>
              </div>

              {/* Run Query Button */}
              <div className="flex justify-center mb-8">
                <Button
                  onClick={handleModuleQuery}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 h-12 text-base font-semibold"
                >
                  Run Query
                </Button>
              </div>

              {/* Results Table */}
              <div className={`rounded-lg border overflow-hidden ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <Table>
                  <TableHeader>
                    <TableRow className={darkMode ? 'bg-slate-700 hover:bg-slate-700 border-slate-600' : 'bg-slate-100 hover:bg-slate-100'}>
                      <TableHead className={`font-semibold text-base h-14 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Subject
                      </TableHead>
                      <TableHead className={`font-semibold text-base h-14 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length > 0 ? (
                      results.map((row, index) => (
                        <TableRow key={index} className={`h-16 ${darkMode ? 'border-slate-700' : ''}`}>
                          <TableCell className={`text-base ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {row.subject}
                          </TableCell>
                          <TableCell className={`text-base ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {row.description}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className={darkMode ? 'border-slate-700' : ''}>
                        <TableCell
                          colSpan={2}
                          className={`text-center h-32 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                        >
                          No results yet. Run a query to see results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>
  )
}
