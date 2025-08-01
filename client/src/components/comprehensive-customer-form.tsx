import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

// Funeral cover rates based on your images
const FUNERAL_COVER_RATES = {
  single: {
    1000: { "0-5": 1.95, "6-13": 2.05, "14-20": 2.25, "46-55": 14.75, "56-60": 17.75 },
    5000: { "0-5": 9.75, "6-13": 10.25, "14-20": 11.25, "46-55": 73.75, "56-60": 88.75 },
    10000: { "0-5": 19.50, "6-13": 20.50, "14-20": 22.50, "46-55": 147.50, "56-60": 177.50 },
    20000: { "0-5": 39.00, "6-13": 41.00, "14-20": 45.00, "46-55": 295.00, "56-60": 355.00 },
    30000: { "0-5": 58.50, "6-13": 61.50, "14-20": 67.50, "46-55": 442.50, "56-60": 532.50 }
  },
  extended: {
    10000: { "18-45": 25.50, "46-55": 35.50, "56-64": 45.50 },
    20000: { "18-45": 51.00, "46-55": 71.00, "56-64": 91.00 },
    30000: { "18-45": 76.50, "46-55": 106.50, "56-64": 136.50 },
    50000: { "18-45": 127.50, "46-55": 177.50, "56-64": 227.50 },
    100000: { "18-45": 255.00, "46-55": 355.00, "56-64": 455.00 }
  }
};

const formSchema = z.object({
  // Main Member Details
  title: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string().optional(),
  idNumber: z.string().min(1, "ID number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().optional(),
  physicalAddress: z.string().optional(),
  postalAddress: z.string().optional(),
  postalCode1: z.string().optional(),
  postalCode2: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  cellphone: z.string().optional(),
  email: z.string().email("Valid email is required"),
  
  // Partner Details
  partnerSurname: z.string().optional(),
  partnerFirstName: z.string().optional(),
  partnerMaidenName: z.string().optional(),
  partnerIdNumber: z.string().optional(),
  partnerDateOfBirth: z.string().optional(),
  partnerAge: z.number().optional(),
  
  // Employment Details
  isSelfEmployed: z.boolean().default(false),
  mainOccupation: z.string().optional(),
  appointmentDate: z.string().optional(),
  isPermanentlyEmployed: z.boolean().default(false),
  basicSalary: z.number().optional(),
  employerName: z.string().optional(),
  employerAddress: z.string().optional(),
  employmentSector: z.string().optional(),
  salaryFrequency: z.string().optional(),
  salaryPaymentDay: z.number().optional(),
  
  // Banking Details
  accountHolder: z.string().optional(),
  bankName: z.string().min(1, "Bank name is required"),
  accountType: z.string().min(1, "Account type is required"),
  policyNumber: z.string().optional(),
  accountNumber: z.string().min(1, "Account number is required"),
  branchCode: z.string().min(1, "Branch code is required"),
  monthlyPremium: z.number().optional(),
  debitAmount: z.number().optional(),
  firstDeductionDate: z.string().optional(),
  
  // Financial Details
  monthlySalary: z.number().optional(),
  totalHouseholdIncome: z.number().optional(),
  incomePercentage: z.number().optional(),
  householdIncomePercentage: z.number().optional(),
  
  // Monthly Expenses
  bondRent: z.number().optional(),
  cellPhone: z.number().optional(),
  entertainment: z.number().optional(),
  food: z.number().optional(),
  transport: z.number().optional(),
  other: z.number().optional(),
  schoolFees: z.number().optional(),
  retailAccounts: z.number().optional(),
  totalExpenses: z.number().optional(),
  
  // Goals
  dignifiedFuneral: z.boolean().default(false),
  familyProtection: z.boolean().default(false),
  saveFuture: z.boolean().default(false),
  
  // Family Members Arrays
  funeralMainMembers: z.array(z.object({
    name: z.string(),
    surname: z.string(),
    idNumber: z.string().optional(),
    coverAmount: z.number().optional(),
    premium: z.number().optional()
  })).default([]),
  
  funeralSpouseMembers: z.array(z.object({
    name: z.string(),
    surname: z.string(),
    idNumber: z.string().optional(),
    coverAmount: z.number().optional(),
    premium: z.number().optional()
  })).default([]),
  
  funeralChildren: z.array(z.object({
    name: z.string(),
    surname: z.string(),
    dateOfBirth: z.string().optional(),
    age: z.number().optional(),
    relation: z.string().optional(),
    coverAmount: z.number().optional(),
    premium: z.number().optional()
  })).default([]),
  
  parentFuneralBenefit: z.array(z.object({
    name: z.string(),
    surname: z.string(),
    dateOfBirth: z.string().optional(),
    age: z.number().optional(),
    relation: z.string().optional(),
    coverAmount: z.number().optional(),
    premium: z.number().optional()
  })).default([]),
  
  extendedFamilyFuneral: z.array(z.object({
    name: z.string(),
    surname: z.string(),
    dateOfBirth: z.string().optional(),
    age: z.number().optional(),
    relation: z.string().optional(),
    coverAmount: z.number().optional(),
    premium: z.number().optional()
  })).default([]),
  
  beneficiaries: z.array(z.object({
    name: z.string(),
    surname: z.string(),
    idNumber: z.string().optional(),
    relation: z.string().optional(),
    percentage: z.number().optional()
  })).default([]),
  
  premiumPayers: z.array(z.object({
    fullName: z.string(),
    address: z.string().optional(),
    telephone: z.string().optional()
  })).default([]),
  
  productId: z.string().min(1, "Product selection is required"),
  agentId: z.string().optional(),
  status: z.string().default("pending")
});

interface ComprehensiveCustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductId?: string;
}

function calculatePremium(coverAmount: number, age: number, type: 'single' | 'extended' = 'single'): number {
  const rates = FUNERAL_COVER_RATES[type];
  let ageGroup = "18-45";
  
  if (age <= 5) ageGroup = "0-5";
  else if (age <= 13) ageGroup = "6-13";
  else if (age <= 20) ageGroup = "14-20";
  else if (age <= 45) ageGroup = "18-45";
  else if (age <= 55) ageGroup = "46-55";
  else if (age <= 60) ageGroup = "56-60";
  else if (age <= 64) ageGroup = "56-64";
  
  // Find closest cover amount
  const availableAmounts = Object.keys(rates).map(Number).sort((a, b) => a - b);
  const closestAmount = availableAmounts.find(amount => amount >= coverAmount) || availableAmounts[availableAmounts.length - 1];
  
  const rateTable = rates[closestAmount as keyof typeof rates];
  if (rateTable && rateTable[ageGroup as keyof typeof rateTable]) {
    return rateTable[ageGroup as keyof typeof rateTable];
  }
  
  return 0;
}

export default function ComprehensiveCustomerForm({ open, onOpenChange, selectedProductId }: ComprehensiveCustomerFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("main-details");
  const [totalRiskPremium, setTotalRiskPremium] = useState(0);
  const [totalMonthlyPremium, setTotalMonthlyPremium] = useState(0);

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return response.json() as Product[];
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      gender: "",
      idNumber: "",
      dateOfBirth: "",
      age: undefined,
      physicalAddress: "",
      postalAddress: "",
      postalCode1: "",
      postalCode2: "",
      phone: "",
      cellphone: "",
      email: "",
      partnerSurname: "",
      partnerFirstName: "",
      partnerMaidenName: "",
      partnerIdNumber: "",
      partnerDateOfBirth: "",
      partnerAge: undefined,
      isSelfEmployed: false,
      mainOccupation: "",
      appointmentDate: "",
      isPermanentlyEmployed: false,
      basicSalary: undefined,
      employerName: "",
      employerAddress: "",
      employmentSector: "",
      salaryFrequency: "",
      salaryPaymentDay: undefined,
      accountHolder: "",
      bankName: "",
      accountType: "",
      policyNumber: "",
      accountNumber: "",
      branchCode: "",
      monthlyPremium: undefined,
      debitAmount: undefined,
      firstDeductionDate: "",
      monthlySalary: undefined,
      totalHouseholdIncome: undefined,
      incomePercentage: undefined,
      householdIncomePercentage: undefined,
      bondRent: undefined,
      cellPhone: undefined,
      entertainment: undefined,
      food: undefined,
      transport: undefined,
      other: undefined,
      schoolFees: undefined,
      retailAccounts: undefined,
      totalExpenses: undefined,
      dignifiedFuneral: false,
      familyProtection: false,
      saveFuture: false,
      funeralMainMembers: [],
      funeralSpouseMembers: [],
      funeralChildren: [],
      parentFuneralBenefit: [],
      extendedFamilyFuneral: [],
      beneficiaries: [],
      premiumPayers: [],
      productId: selectedProductId || "",
      status: "pending"
    },
  });

  // Field arrays for dynamic sections
  const funeralMainFields = useFieldArray({ control: form.control, name: "funeralMainMembers" });
  const funeralSpouseFields = useFieldArray({ control: form.control, name: "funeralSpouseMembers" });
  const funeralChildrenFields = useFieldArray({ control: form.control, name: "funeralChildren" });
  const parentFuneralFields = useFieldArray({ control: form.control, name: "parentFuneralBenefit" });
  const extendedFamilyFields = useFieldArray({ control: form.control, name: "extendedFamilyFuneral" });
  const beneficiariesFields = useFieldArray({ control: form.control, name: "beneficiaries" });
  const premiumPayersFields = useFieldArray({ control: form.control, name: "premiumPayers" });

  // Calculate totals
  useEffect(() => {
    const expenses = form.watch([
      "bondRent", "cellPhone", "entertainment", "food", "transport", 
      "other", "schoolFees", "retailAccounts"
    ]);
    const total = expenses.reduce((sum, val) => (sum || 0) + (val || 0), 0);
    form.setValue("totalExpenses", total);
  }, [form.watch(["bondRent", "cellPhone", "entertainment", "food", "transport", "other", "schoolFees", "retailAccounts"])]);

  const createCustomerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
      toast({ title: "Success", description: "Customer registered successfully!" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register customer",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comprehensive Customer Registration</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createCustomerMutation.mutate(data))}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="main-details">Main Details</TabsTrigger>
                <TabsTrigger value="partner-employment">Partner & Employment</TabsTrigger>
                <TabsTrigger value="benefit-selections">Benefit Selections</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
                <TabsTrigger value="affordability">Affordability</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="declaration">Declaration</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              {/* Tab 1: Main Member Details */}
              <TabsContent value="main-details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">MAIN MEMBER DETAILS</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title:</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Mr." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mr">Mr.</SelectItem>
                              <SelectItem value="Mrs">Mrs.</SelectItem>
                              <SelectItem value="Ms">Ms.</SelectItem>
                              <SelectItem value="Dr">Dr.</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender:</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>I.D. Number:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Names:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>D.O.B:</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="physicalAddress"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Physical Address:</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age:</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Contact Details */}
                <Card>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
                    <div className="col-span-1">
                      <label className="text-sm font-medium">Contact Details:</label>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>W</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Work Phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cellphone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>C</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Cell Phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Partner & Employment Details */}
              <TabsContent value="partner-employment" className="space-y-6">
                {/* Partner Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">PARTNER DETAILS</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="partnerSurname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partnerIdNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>I.D. Number:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partnerFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Names:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partnerDateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>D.O.B:</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partnerMaidenName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maiden Name:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partnerAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age:</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Employment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">EMPLOYMENT DETAILS</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="isSelfEmployed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Are you self employed?</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainOccupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main occupation:</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Manager" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appointmentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Date:</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPermanentlyEmployed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Are you permanently employed?</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="basicSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basic Salary before deductions:</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employerName"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Name and address of employer:</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-4 gap-2 col-span-4">
                      <FormField
                        control={form.control}
                        name="employmentSector"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment sector:</FormLabel>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  checked={field.value === "Government"} 
                                  onCheckedChange={(checked) => checked && field.onChange("Government")} 
                                />
                                <label>Government</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  checked={field.value === "Semi-Government"} 
                                  onCheckedChange={(checked) => checked && field.onChange("Semi-Government")} 
                                />
                                <label>Semi-Government</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  checked={field.value === "Private sector"} 
                                  onCheckedChange={(checked) => checked && field.onChange("Private sector")} 
                                />
                                <label>Private sector</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  checked={field.value === "Informal sector"} 
                                  onCheckedChange={(checked) => checked && field.onChange("Informal sector")} 
                                />
                                <label>Informal sector</label>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salaryFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salary frequency:</FormLabel>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  checked={field.value === "Monthly"} 
                                  onCheckedChange={(checked) => checked && field.onChange("Monthly")} 
                                />
                                <label>Monthly</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  checked={field.value === "Fortnightly"} 
                                  onCheckedChange={(checked) => checked && field.onChange("Fortnightly")} 
                                />
                                <label>Fortnightly</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  checked={field.value === "Weekly"} 
                                  onCheckedChange={(checked) => checked && field.onChange("Weekly")} 
                                />
                                <label>Weekly</label>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salaryPaymentDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salary payment day:</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Benefit Selections */}
              <TabsContent value="benefit-selections" className="space-y-6">
                {/* Funeral Cover Main Member */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">FUNERAL COVER MAIN MEMBER</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="font-semibold">Name:</div>
                      <div className="font-semibold">Surname:</div>
                      <div className="font-semibold">ID Number:</div>
                      <div className="font-semibold">Cover Amount:</div>
                      <div className="font-semibold">Premium:</div>
                    </div>
                    {funeralMainFields.fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-6 gap-4 mb-2">
                        <FormField
                          control={form.control}
                          name={`funeralMainMembers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="#NAME?" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralMainMembers.${index}.surname`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="#NAME?" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralMainMembers.${index}.idNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralMainMembers.${index}.coverAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralMainMembers.${index}.premium`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R 0,00" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => funeralMainFields.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => funeralMainFields.append({ name: "", surname: "", idNumber: "", coverAmount: 0, premium: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Member
                    </Button>
                  </CardContent>
                </Card>

                {/* Funeral Cover Spouse/Partner */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">FUNERAL COVER SPOUSE / PARTNER</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="font-semibold">Name:</div>
                      <div className="font-semibold">Surname:</div>
                      <div className="font-semibold">ID Number:</div>
                      <div className="font-semibold">Cover Amount:</div>
                      <div className="font-semibold">Premium:</div>
                    </div>
                    {funeralSpouseFields.fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-6 gap-4 mb-2">
                        <FormField
                          control={form.control}
                          name={`funeralSpouseMembers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralSpouseMembers.${index}.surname`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralSpouseMembers.${index}.idNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralSpouseMembers.${index}.coverAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralSpouseMembers.${index}.premium`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R 0,00" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => funeralSpouseFields.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => funeralSpouseFields.append({ name: "", surname: "", idNumber: "", coverAmount: 0, premium: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Spouse/Partner
                    </Button>
                  </CardContent>
                </Card>

                {/* Funeral Cover Dependent Children */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">FUNERAL COVER - DEPENDENT CHILDREN</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-4 mb-4">
                      <div className="font-semibold">Name:</div>
                      <div className="font-semibold">Surname:</div>
                      <div className="font-semibold">D.O.B</div>
                      <div className="font-semibold">Age:</div>
                      <div className="font-semibold">Relation:</div>
                      <div className="font-semibold">Cover Amount:</div>
                      <div className="font-semibold">Premium:</div>
                    </div>
                    {funeralChildrenFields.fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-8 gap-2 mb-2">
                        <FormField
                          control={form.control}
                          name={`funeralChildren.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralChildren.${index}.surname`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralChildren.${index}.dateOfBirth`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralChildren.${index}.age`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralChildren.${index}.relation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralChildren.${index}.coverAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`funeralChildren.${index}.premium`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R 0,00" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => funeralChildrenFields.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-right font-semibold">R0,00</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => funeralChildrenFields.append({ name: "", surname: "", dateOfBirth: "", age: 0, relation: "", coverAmount: 0, premium: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Child
                    </Button>
                  </CardContent>
                </Card>

                {/* Retirement Savings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">RETIREMENT SAVINGS</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label>RETIREMENT SAVINGS - MAIN MEMBER</label>
                      <div className="text-right">RSM</div>
                    </div>
                    <div>
                      <label>RETIREMENT SAVINGS - SPOUSE</label>
                      <div className="text-right">RSS</div>
                    </div>
                    <div className="col-span-2 text-right font-semibold">R0,00</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Banking Details */}
              <TabsContent value="banking" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">BANKING DETAILS</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accountHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank / Building Society:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="branchCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Number:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="policyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyPremium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Premium:</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R0,00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number:</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="debitAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Debit Amount Authorised:</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R0,00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firstDeductionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of First Deduction:</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Benefit Options Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">BENEFIT OPTIONS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="font-semibold">BENEFIT DESCRIPTIONS</div>
                      <div className="font-semibold text-center">SELECT</div>
                      <div className="font-semibold text-center">COVER</div>
                      <div className="font-semibold text-center">PREMIUM</div>
                    </div>
                    
                    {[
                      { name: "Funeral Cover Main Member", cover: "R0,00", premium: "R 0,00" },
                      { name: "Funeral Cover Spouse / Partner", cover: "R0,00", premium: "R 0,00" },
                      { name: "Funeral Cover All Dependent Children", cover: "VARIOUS", premium: "R0,00" },
                      { name: "Parent Funeral Benefit", cover: "VARIOUS", premium: "R0,00" },
                      { name: "Extended Family Funeral Benefit", cover: "VARIOUS", premium: "R0,00" },
                      { name: "ADDB Main Member", cover: "R0,00", premium: "R 0,00" },
                      { name: "ADDB Spouse", cover: "R0,00", premium: "R 0,00" }
                    ].map((benefit, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 py-2 border-b">
                        <div>{benefit.name}</div>
                        <div className="text-center">
                          <Checkbox />
                        </div>
                        <div className="text-center">{benefit.cover}</div>
                        <div className="text-center">{benefit.premium}</div>
                      </div>
                    ))}
                    
                    <div className="grid grid-cols-4 gap-4 py-2 font-semibold">
                      <div></div>
                      <div className="text-center">Total Risk Premium</div>
                      <div></div>
                      <div className="text-center">R0,00</div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 py-2">
                      <div>Retirement Savings Premium</div>
                      <div></div>
                      <div></div>
                      <div className="text-center">R0,00</div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 py-2 font-semibold bg-blue-100">
                      <div></div>
                      <div className="text-center">Total Monthly Premium</div>
                      <div></div>
                      <div className="text-center">R0,00</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 5: Affordability Questionnaire */}
              <TabsContent value="affordability" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">AFFORDABILITY QUESTIONNAIRE</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="monthlySalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is your monthly salary before deductions?</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalHouseholdIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total household income?</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="incomePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>15% of income?</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R0,00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="householdIncomePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>15% of household income?</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R0,00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Monthly Expenses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">List of monthly expenses</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="bondRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bond / Rent</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="food"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Food</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schoolFees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School fees</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cellPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cell phone</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transport</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="retailAccounts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Retail accounts</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entertainment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entertainment</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="other"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name="totalExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R0,00" readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 6: Goals and Financial Plan */}
              <TabsContent value="goals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">Goalsetting and Financial Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dignifiedFuneral"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>I want to have a dignified funeral for my loved ones</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="familyProtection"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>I want my family protected in the case of my accidental death</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="saveFuture"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>I want to save for my future or retirement</FormLabel>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Nominated Beneficiaries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">NOMINATED BENEFICIARIES</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="font-semibold">Name:</div>
                      <div className="font-semibold">Surname:</div>
                      <div className="font-semibold">I.D Number:</div>
                      <div className="font-semibold">Relation:</div>
                      <div className="font-semibold">Percentage:</div>
                    </div>
                    {beneficiariesFields.fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-6 gap-4 mb-2">
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.surname`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.idNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.relation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.percentage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => beneficiariesFields.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => beneficiariesFields.append({ name: "", surname: "", idNumber: "", relation: "", percentage: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Beneficiary
                    </Button>
                  </CardContent>
                </Card>

                {/* Premium Payer Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">PREMIUM PAYER DETAILS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="font-semibold">Full Names:</div>
                      <div className="font-semibold">Address:</div>
                      <div className="font-semibold">Tel:</div>
                    </div>
                    {premiumPayersFields.fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-4 gap-4 mb-2">
                        <FormField
                          control={form.control}
                          name={`premiumPayers.${index}.fullName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="#NAME?" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`premiumPayers.${index}.address`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`premiumPayers.${index}.telephone`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => premiumPayersFields.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => premiumPayersFields.append({ fullName: "", address: "", telephone: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Premium Payer
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 7: Declaration */}
              <TabsContent value="declaration" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">DECLARATION</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 space-y-2">
                      <p>I confirm that I am taking out the LIFECARE 24 PLAN based on the following conditions:</p>
                      <p>I declare that all members covered under this policy are in good health;</p>
                      <p>I confirm that the premium as mentioned is affordable to me;</p>
                      <p>I understand the benefits of the policy as explained to me;</p>
                      <p>I understand that Prime Invest Group will institute a debit order against my bank account for the policy premiums;</p>
                      <p>I hereby authorise the deduction of the applicable policy premiums from my bank account;</p>
                      <p>I understand that I have a 30 day cooling off period;</p>
                    </div>
                    
                    <div className="bg-gray-100 p-4 text-sm">
                      <p className="font-semibold">Our Contact Telephone Number is: 078 047 3749 . Our email address is: info@oraclegroup.co.za . Website: www.oraclegroup.co.za</p>
                      <p>The Office Hours are: Mondays to Fridays from 9AM to 4PM. We are closed on Public Holidays and Weekends.</p>
                      <p>Our Physical and Postal Address is: 260 Uys Krige Drive, Loevenstein, Bellville, 7530, Cape Town</p>
                      <p>We are an Authorised Financial Services Provider, Our FSP License Number is: 50974</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border p-4">
                      <div>
                        <label className="font-semibold">Applicants Voice Confirmation</label>
                        <div className="mt-2">
                          <Checkbox />
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold">Account Holders Voice Confirmation</label>
                        <div className="mt-2">
                          <Checkbox />
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold">Date</label>
                        <div className="mt-2">01/08/2025</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border p-4">
                      <div>
                        <label className="font-semibold">Policy Delivery Confirmed</label>
                      </div>
                      <div>
                        <label className="font-semibold">Confirmation Date</label>
                      </div>
                      <div></div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 8: Summary */}
              <TabsContent value="summary" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="bg-blue-100 text-blue-800 p-2 text-center">APPLICATION SUMMARY</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold">Customer Details:</h3>
                        <p>{form.watch("firstName")} {form.watch("lastName")}</p>
                        <p>{form.watch("email")}</p>
                        <p>{form.watch("phone")}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Product Selection:</h3>
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selected Product</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} - R{product.monthlyPrice}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4">
                      <h3 className="font-semibold">Premium Summary:</h3>
                      <div className="flex justify-between">
                        <span>Total Risk Premium:</span>
                        <span>R{totalRiskPremium.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retirement Savings:</span>
                        <span>R0.00</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total Monthly Premium:</span>
                        <span>R{totalMonthlyPremium.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending ? "Processing..." : "Register Customer"}
                </Button>
              </div>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}