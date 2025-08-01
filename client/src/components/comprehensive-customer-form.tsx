import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  relationship: string;
  coverAmount: string;
  premium: number;
}

interface ComprehensiveCustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductId?: string;
}

// Premium calculation tables based on relationship and age
const PREMIUM_RATES = {
  main_member: {
    "5000": { "18-39": 45, "40-59": 65, "60-75": 95 },
    "10000": { "18-39": 85, "40-59": 125, "60-75": 185 },
    "20000": { "18-39": 165, "40-59": 245, "60-75": 365 },
    "30000": { "18-39": 245, "40-59": 365, "60-75": 545 },
    "50000": { "18-39": 405, "40-59": 605, "60-75": 905 }
  },
  spouse: {
    "5000": { "18-39": 45, "40-59": 65, "60-75": 95 },
    "10000": { "18-39": 85, "40-59": 125, "60-75": 185 },
    "20000": { "18-39": 165, "40-59": 245, "60-75": 365 },
    "30000": { "18-39": 245, "40-59": 365, "60-75": 545 },
    "50000": { "18-39": 405, "40-59": 605, "60-75": 905 }
  },
  child: {
    "1000": { "0-17": 15 },
    "2000": { "0-17": 25 },
    "3000": { "0-17": 35 },
    "5000": { "0-17": 55 }
  },
  parent: {
    "5000": { "50-75": 125 },
    "10000": { "50-75": 245 },
    "15000": { "50-75": 365 }
  }
};

const formSchema = z.object({
  // Personal Information
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  idNumber: z.string().min(13, "ID number must be 13 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  
  // Address Information
  physicalAddress1: z.string().min(1, "Physical address is required"),
  physicalAddress2: z.string().optional(),
  physicalSuburb: z.string().min(1, "Suburb is required"),
  physicalProvince: z.string().min(1, "Province is required"),
  physicalPostalCode: z.string().min(4, "Postal code must be 4 digits"),
  
  postalAddress1: z.string().min(1, "Postal address is required"),
  postalAddress2: z.string().optional(),
  postalSuburb: z.string().min(1, "Postal suburb is required"),
  postalProvince: z.string().min(1, "Postal province is required"),
  postalPostalCode: z.string().min(4, "Postal code must be 4 digits"),
  sameAsPhysical: z.boolean().default(false),
  
  // Contact Information
  whatsapp: z.string().optional(),
  sms: z.string().optional(),
  sameNumberForAll: z.boolean().default(false),
  
  // Banking Information
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountType: z.string().min(1, "Account type is required"),
  branchCode: z.string().min(1, "Branch code is required"),
  
  // Employment Information
  employer: z.string().min(1, "Employer is required"),
  occupation: z.string().min(1, "Occupation is required"),
  workPhone: z.string().optional(),
  monthlyIncome: z.string().min(1, "Monthly income is required"),
  
  // Product Selection
  productId: z.string().min(1, "Product selection is required"),
  
  // Affordability
  totalExpenses: z.string().default("0"),
  affordability: z.string().default("0"),
  
  // Consent
  consent: z.boolean().refine(val => val === true, "Consent is required")
});

type FormData = z.infer<typeof formSchema>;

export default function ComprehensiveCustomerForm({ open, onOpenChange, selectedProductId }: ComprehensiveCustomerFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("personal");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [totalPremium, setTotalPremium] = useState(0);

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return response.json() as Product[];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      idNumber: "",
      dateOfBirth: "",
      nationality: "South African",
      physicalAddress1: "",
      physicalAddress2: "",
      physicalSuburb: "",
      physicalProvince: "",
      physicalPostalCode: "",
      postalAddress1: "",
      postalAddress2: "",
      postalSuburb: "",
      postalProvince: "",
      postalPostalCode: "",
      sameAsPhysical: false,
      whatsapp: "",
      sms: "",
      sameNumberForAll: false,
      bankName: "",
      accountNumber: "",
      accountType: "",
      branchCode: "",
      employer: "",
      occupation: "",
      workPhone: "",
      monthlyIncome: "",
      productId: selectedProductId || "",
      totalExpenses: "0",
      affordability: "0",
      consent: false
    }
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const customerData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        idNumber: data.idNumber,
        dateOfBirth: data.dateOfBirth,
        address: `${data.physicalAddress1}, ${data.physicalSuburb}, ${data.physicalProvince}`,
        city: data.physicalSuburb,
        province: data.physicalProvince,
        postalCode: data.physicalPostalCode,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        branchCode: data.branchCode,
        productId: data.productId,
        status: "pending" as const
      };
      
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer registered successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      onOpenChange(false);
      form.reset();
      setFamilyMembers([]);
      setTotalPremium(0);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register customer",
        variant: "destructive"
      });
    }
  });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Get age bracket for premium calculation
  const getAgeBracket = (age: number, relationship: string): string => {
    if (relationship === 'child') {
      return '0-17';
    } else if (relationship === 'parent') {
      return '50-75';
    } else {
      if (age >= 18 && age <= 39) return '18-39';
      if (age >= 40 && age <= 59) return '40-59';
      if (age >= 60 && age <= 75) return '60-75';
    }
    return '18-39';
  };

  // Calculate premium based on relationship, age, and cover amount
  const calculatePremium = (relationship: string, age: number, coverAmount: string): number => {
    const relationshipKey = relationship === 'son' || relationship === 'daughter' ? 'child' : 
                           relationship === 'mother' || relationship === 'father' ? 'parent' : relationship;
    
    const ageBracket = getAgeBracket(age, relationshipKey);
    const rates = PREMIUM_RATES[relationshipKey as keyof typeof PREMIUM_RATES];
    
    if (rates && rates[coverAmount as keyof typeof rates]) {
      const ageRates = rates[coverAmount as keyof typeof rates];
      return ageRates[ageBracket as keyof typeof ageRates] || 0;
    }
    
    return 0;
  };

  // Add new family member
  const addFamilyMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: 0,
      relationship: "",
      coverAmount: "",
      premium: 0
    };
    setFamilyMembers([...familyMembers, newMember]);
  };

  // Remove family member
  const removeFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
  };

  // Update family member
  const updateFamilyMember = (id: string, field: keyof FamilyMember, value: any) => {
    setFamilyMembers(familyMembers.map(member => {
      if (member.id === id) {
        const updated = { ...member, [field]: value };
        
        // Auto-calculate age when date of birth changes
        if (field === 'dateOfBirth' && value) {
          updated.age = calculateAge(value);
        }
        
        // Auto-calculate premium when relationship, age, or cover amount changes
        if ((field === 'relationship' || field === 'coverAmount' || field === 'dateOfBirth') && 
            updated.relationship && updated.coverAmount && updated.age > 0) {
          updated.premium = calculatePremium(updated.relationship, updated.age, updated.coverAmount);
        }
        
        return updated;
      }
      return member;
    }));
  };

  // Calculate total premium
  useEffect(() => {
    const total = familyMembers.reduce((sum, member) => sum + member.premium, 0);
    setTotalPremium(total);
  }, [familyMembers]);

  // Handle same address checkbox
  const handleSameAddress = (checked: boolean) => {
    form.setValue('sameAsPhysical', checked);
    if (checked) {
      const physicalAddress1 = form.getValues('physicalAddress1');
      const physicalAddress2 = form.getValues('physicalAddress2');
      const physicalSuburb = form.getValues('physicalSuburb');
      const physicalProvince = form.getValues('physicalProvince');
      const physicalPostalCode = form.getValues('physicalPostalCode');
      
      form.setValue('postalAddress1', physicalAddress1);
      form.setValue('postalAddress2', physicalAddress2 || '');
      form.setValue('postalSuburb', physicalSuburb);
      form.setValue('postalProvince', physicalProvince);
      form.setValue('postalPostalCode', physicalPostalCode);
    }
  };

  // Handle same number checkbox
  const handleSameNumber = (checked: boolean) => {
    form.setValue('sameNumberForAll', checked);
    if (checked) {
      const phone = form.getValues('phone');
      form.setValue('whatsapp', phone);
      form.setValue('sms', phone);
    }
  };

  // Get cover amount options based on relationship and age
  const getCoverAmountOptions = (relationship: string, age: number) => {
    if (relationship === 'child' || relationship === 'son' || relationship === 'daughter') {
      return [
        { value: "1000", label: "R1,000" },
        { value: "2000", label: "R2,000" },
        { value: "3000", label: "R3,000" },
        { value: "5000", label: "R5,000" }
      ];
    } else if (relationship === 'parent' || relationship === 'mother' || relationship === 'father') {
      return [
        { value: "5000", label: "R5,000" },
        { value: "10000", label: "R10,000" },
        { value: "15000", label: "R15,000" }
      ];
    } else {
      return [
        { value: "5000", label: "R5,000" },
        { value: "10000", label: "R10,000" },
        { value: "20000", label: "R20,000" },
        { value: "30000", label: "R30,000" },
        { value: "50000", label: "R50,000" }
      ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comprehensive Customer Registration</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createCustomerMutation.mutate(data))}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="personal">1. Personal</TabsTrigger>
                <TabsTrigger value="address">2. Address</TabsTrigger>
                <TabsTrigger value="employment">3. Employment</TabsTrigger>
                <TabsTrigger value="banking">4. Banking</TabsTrigger>
                <TabsTrigger value="family">5. Family</TabsTrigger>
                <TabsTrigger value="product">6. Product</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select title" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mr">Mr.</SelectItem>
                                <SelectItem value="mrs">Mrs.</SelectItem>
                                <SelectItem value="ms">Ms.</SelectItem>
                                <SelectItem value="miss">Miss</SelectItem>
                                <SelectItem value="dr">Dr.</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select nationality" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="South African">South African</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="13-digit ID number" />
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
                            <FormLabel>Date of Birth *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
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
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0123456789" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMS Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <FormField
                          control={form.control}
                          name="sameNumberForAll"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    handleSameNumber(checked as boolean);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">
                                Same as mobile
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Address Information Tab */}
              <TabsContent value="address" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h4 className="font-semibold text-lg">Physical Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="physicalAddress1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1 *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="physicalAddress2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="physicalSuburb"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Suburb *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="physicalProvince"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                                <SelectItem value="Free State">Free State</SelectItem>
                                <SelectItem value="Gauteng">Gauteng</SelectItem>
                                <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                                <SelectItem value="Limpopo">Limpopo</SelectItem>
                                <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                                <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                                <SelectItem value="North West">North West</SelectItem>
                                <SelectItem value="Western Cape">Western Cape</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="physicalPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="4 digits" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="sameAsPhysical"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handleSameAddress(checked as boolean);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">
                              Postal address same as physical address
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <h4 className="font-semibold text-lg">Postal Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postalAddress1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Address Line 1 *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalAddress2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Address Line 2</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalSuburb"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Suburb *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalProvince"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Province *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                                <SelectItem value="Free State">Free State</SelectItem>
                                <SelectItem value="Gauteng">Gauteng</SelectItem>
                                <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                                <SelectItem value="Limpopo">Limpopo</SelectItem>
                                <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                                <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                                <SelectItem value="North West">North West</SelectItem>
                                <SelectItem value="Western Cape">Western Cape</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="4 digits" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Employment Information Tab */}
              <TabsContent value="employment" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Employment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="employer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employer *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="workPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="monthlyIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Income *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="R 0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Banking Information Tab */}
              <TabsContent value="banking" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Banking Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ABSA">ABSA</SelectItem>
                                <SelectItem value="Standard Bank">Standard Bank</SelectItem>
                                <SelectItem value="FNB">FNB</SelectItem>
                                <SelectItem value="Nedbank">Nedbank</SelectItem>
                                <SelectItem value="Capitec">Capitec</SelectItem>
                                <SelectItem value="African Bank">African Bank</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Savings">Savings</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                                <SelectItem value="Current">Current</SelectItem>
                                <SelectItem value="Transmission">Transmission</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number *</FormLabel>
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
                            <FormLabel>Branch Code *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Family Information Tab */}
              <TabsContent value="family" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Family Members</CardTitle>
                      <Button type="button" onClick={addFamilyMember} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Family Member
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {familyMembers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No family members added yet. Click "Add Family Member" to start.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>First Name</TableHead>
                              <TableHead>Last Name</TableHead>
                              <TableHead>Date of Birth</TableHead>
                              <TableHead>Age</TableHead>
                              <TableHead>Relationship</TableHead>
                              <TableHead>Cover Amount</TableHead>
                              <TableHead>Premium</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {familyMembers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell>
                                  <Input
                                    value={member.firstName}
                                    onChange={(e) => updateFamilyMember(member.id, 'firstName', e.target.value)}
                                    placeholder="First name"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={member.lastName}
                                    onChange={(e) => updateFamilyMember(member.id, 'lastName', e.target.value)}
                                    placeholder="Last name"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="date"
                                    value={member.dateOfBirth}
                                    onChange={(e) => updateFamilyMember(member.id, 'dateOfBirth', e.target.value)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={member.age}
                                    disabled
                                    className="w-16"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={member.relationship}
                                    onValueChange={(value) => updateFamilyMember(member.id, 'relationship', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Relationship" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="spouse">Spouse</SelectItem>
                                      <SelectItem value="son">Son</SelectItem>
                                      <SelectItem value="daughter">Daughter</SelectItem>
                                      <SelectItem value="mother">Mother</SelectItem>
                                      <SelectItem value="father">Father</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={member.coverAmount}
                                    onValueChange={(value) => updateFamilyMember(member.id, 'coverAmount', value)}
                                    disabled={!member.relationship || member.age === 0}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Cover" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getCoverAmountOptions(member.relationship, member.age).map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="w-full justify-center">
                                    R{member.premium.toFixed(2)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeFamilyMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        <div className="flex justify-end">
                          <div className="bg-primary/10 p-4 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Calculator className="h-5 w-5 text-primary" />
                              <span className="font-semibold">Total Monthly Premium: </span>
                              <Badge variant="default" className="text-lg px-3 py-1">
                                R{totalPremium.toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Product Selection Tab */}
              <TabsContent value="product" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Selection & Consent</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Lifestyle Product *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - R{product.monthlyPrice}/month
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="consent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I consent to the processing of my personal information *
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              I agree to the terms and conditions and consent to the processing of my personal 
                              information for the purpose of this insurance application and related services.
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <div className="space-x-2">
                {activeTab !== "personal" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const tabs = ["personal", "address", "employment", "banking", "family", "product"];
                      const currentIndex = tabs.indexOf(activeTab);
                      setActiveTab(tabs[currentIndex - 1]);
                    }}
                  >
                    Previous
                  </Button>
                )}
                {activeTab !== "product" ? (
                  <Button
                    type="button"
                    onClick={() => {
                      const tabs = ["personal", "address", "employment", "banking", "family", "product"];
                      const currentIndex = tabs.indexOf(activeTab);
                      setActiveTab(tabs[currentIndex + 1]);
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createCustomerMutation.isPending}
                  >
                    {createCustomerMutation.isPending ? "Registering..." : "Register Customer"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}