"use client";

import { useState, useCallback, useRef, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  TRUCK_MAKES,
  ENGINE_MAKES,
  REQUIRED_PHOTO_CATEGORIES,
  OPTIONAL_PHOTO_CATEGORIES,
  US_STATES,
} from "@/lib/constants";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Upload,
  X,
  ImageIcon,
  Truck,
  AlertTriangle,
  DollarSign,
  ClipboardCheck,
  Camera,
  Wrench,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TransmissionType = "MANUAL" | "AUTO" | "AUTOMATED_MANUAL";
type AxleConfiguration = "SINGLE" | "TANDEM" | "TRI_AXLE";
type SleeperType = "NONE" | "MID_ROOF" | "RAISED_ROOF" | "FLAT_TOP" | "CONDO";
type FuelType = "DIESEL" | "CNG" | "ELECTRIC";
type EmissionsStandard = "PRE_EPA07" | "EPA07" | "EPA10" | "EPA13" | "EPA17_PLUS";
type DriveTrain = "FOUR_BY_TWO" | "SIX_BY_FOUR" | "SIX_BY_TWO";

interface PhotoFile {
  file: File;
  preview: string;
  category: string;
}

interface MaintenanceRecord {
  type: string;
  description: string;
  mileageAtService: string;
  datePerformed: string;
  shopName: string;
  documentFile: File | null;
}

interface FormData {
  // Step 1: Basic info
  year: string;
  make: string;
  model: string;
  title: string;
  vin: string;
  mileage: string;
  locationCity: string;
  locationState: string;
  locationZip: string;

  // Step 2: Specs & details
  engineMake: string;
  engineModel: string;
  engineHP: string;
  transmissionType: TransmissionType | "";
  transmissionModel: string;
  axleConfiguration: AxleConfiguration | "";
  suspensionType: string;
  wheelbase: string;
  sleeperType: SleeperType | "";
  fifthWheelType: string;
  fuelType: FuelType | "";
  emissionsStandard: EmissionsStandard | "";
  carbCompliant: boolean;
  driveTrain: DriveTrain | "";
  exteriorColor: string;
  interiorCondition: string;
  tireCondition: string;
  tireBrand: string;
  tireSize: string;
  brakeCondition: string;
  dpfStatus: string;
  egrStatus: string;
  aftertreatmentNotes: string;
  description: string;

  // Step 3: Condition & maintenance
  noDamage: boolean;
  knownIssues: string;
  maintenanceRecords: MaintenanceRecord[];

  // Step 4: Photos
  photos: PhotoFile[];

  // Step 5: Pricing
  startingBid: string;
  hasReserve: boolean;
  reservePrice: string;
  hasBuyNow: boolean;
  buyNowPrice: string;
  auctionDurationDays: string;
  listingTier: "STANDARD" | "FEATURED";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Basic Info", icon: Truck },
  { label: "Specs & Details", icon: Wrench },
  { label: "Condition", icon: AlertTriangle },
  { label: "Photos", icon: Camera },
  { label: "Pricing", icon: DollarSign },
  { label: "Review", icon: ClipboardCheck },
] as const;

const TRANSMISSION_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "AUTO", label: "Automatic" },
  { value: "AUTOMATED_MANUAL", label: "Automated Manual" },
];

const AXLE_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "TANDEM", label: "Tandem" },
  { value: "TRI_AXLE", label: "Tri-Axle" },
];

const SLEEPER_OPTIONS = [
  { value: "NONE", label: "None (Day Cab)" },
  { value: "MID_ROOF", label: "Mid Roof" },
  { value: "RAISED_ROOF", label: "Raised Roof" },
  { value: "FLAT_TOP", label: "Flat Top" },
  { value: "CONDO", label: "Condo" },
];

const FUEL_OPTIONS = [
  { value: "DIESEL", label: "Diesel" },
  { value: "CNG", label: "CNG" },
  { value: "ELECTRIC", label: "Electric" },
];

const EMISSIONS_OPTIONS = [
  { value: "PRE_EPA07", label: "Pre-EPA 2007" },
  { value: "EPA07", label: "EPA 2007" },
  { value: "EPA10", label: "EPA 2010" },
  { value: "EPA13", label: "EPA 2013" },
  { value: "EPA17_PLUS", label: "EPA 2017+" },
];

const DRIVETRAIN_OPTIONS = [
  { value: "FOUR_BY_TWO", label: "4x2" },
  { value: "SIX_BY_FOUR", label: "6x4" },
  { value: "SIX_BY_TWO", label: "6x2" },
];

const MAINTENANCE_TYPE_OPTIONS = [
  { value: "OIL_CHANGE", label: "Oil Change" },
  { value: "TRANSMISSION_SERVICE", label: "Transmission Service" },
  { value: "DPF_CLEAN_REGEN", label: "DPF Clean / Regen" },
  { value: "INJECTOR_REPLACEMENT", label: "Injector Replacement" },
  { value: "TURBO_SERVICE", label: "Turbo Service" },
  { value: "EGR_SERVICE", label: "EGR Service" },
  { value: "BRAKE_SERVICE", label: "Brake Service" },
  { value: "TIRE_REPLACEMENT", label: "Tire Replacement" },
  { value: "CLUTCH_REPLACEMENT", label: "Clutch Replacement" },
  { value: "COOLANT_SERVICE", label: "Coolant Service" },
  { value: "ECM_REPORT", label: "ECM Report" },
  { value: "OIL_ANALYSIS", label: "Oil Analysis" },
  { value: "OTHER", label: "Other" },
];

const DURATION_OPTIONS = [
  { value: "3", label: "3 Days" },
  { value: "5", label: "5 Days" },
  { value: "7", label: "7 Days" },
  { value: "10", label: "10 Days" },
  { value: "14", label: "14 Days" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const y = String(currentYear + 1 - i);
  return { value: y, label: y };
});

const MAKE_OPTIONS = TRUCK_MAKES.map((m) => ({ value: m, label: m }));
const ENGINE_MAKE_OPTIONS = ENGINE_MAKES.map((m) => ({ value: m, label: m }));
const STATE_OPTIONS = US_STATES.map((s) => ({ value: s, label: s }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dollarsToCents(dollars: string): number {
  const num = parseFloat(dollars.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

function formatDollar(value: string): string {
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return "";
  return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function createEmptyMaintenanceRecord(): MaintenanceRecord {
  return {
    type: "",
    description: "",
    mileageAtService: "",
    datePerformed: "",
    shopName: "",
    documentFile: null,
  };
}

const initialFormData: FormData = {
  year: "",
  make: "",
  model: "",
  title: "",
  vin: "",
  mileage: "",
  locationCity: "",
  locationState: "",
  locationZip: "",
  engineMake: "",
  engineModel: "",
  engineHP: "",
  transmissionType: "",
  transmissionModel: "",
  axleConfiguration: "",
  suspensionType: "",
  wheelbase: "",
  sleeperType: "",
  fifthWheelType: "",
  fuelType: "DIESEL",
  emissionsStandard: "",
  carbCompliant: false,
  driveTrain: "",
  exteriorColor: "",
  interiorCondition: "",
  tireCondition: "",
  tireBrand: "",
  tireSize: "",
  brakeCondition: "",
  dpfStatus: "",
  egrStatus: "",
  aftertreatmentNotes: "",
  description: "",
  noDamage: true,
  knownIssues: "",
  maintenanceRecords: [],
  photos: [],
  startingBid: "",
  hasReserve: false,
  reservePrice: "",
  hasBuyNow: false,
  buyNowPrice: "",
  auctionDurationDays: "7",
  listingTier: "STANDARD",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewListingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>(
    REQUIRED_PHOTO_CATEGORIES[0].key
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Field Updates ─────────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const updateMaintenanceRecord = useCallback(
    (index: number, field: keyof MaintenanceRecord, value: string | File | null) => {
      setForm((prev) => {
        const records = [...prev.maintenanceRecords];
        records[index] = { ...records[index], [field]: value };
        return { ...prev, maintenanceRecords: records };
      });
    },
    []
  );

  const addMaintenanceRecord = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      maintenanceRecords: [...prev.maintenanceRecords, createEmptyMaintenanceRecord()],
    }));
  }, []);

  const removeMaintenanceRecord = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      maintenanceRecords: prev.maintenanceRecords.filter((_, i) => i !== index),
    }));
  }, []);

  // ─── Photo Handling ────────────────────────────────────────────────────────

  const addPhotos = useCallback(
    (files: FileList | File[]) => {
      const newPhotos: PhotoFile[] = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          category: selectedPhotoCategory,
        }));

      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));
    },
    [selectedPhotoCategory]
  );

  const removePhoto = useCallback((index: number) => {
    setForm((prev) => {
      const photos = [...prev.photos];
      URL.revokeObjectURL(photos[index].preview);
      photos.splice(index, 1);
      return { ...prev, photos };
    });
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addPhotos(e.dataTransfer.files);
      }
    },
    [addPhotos]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addPhotos(e.target.files);
        e.target.value = "";
      }
    },
    [addPhotos]
  );

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic info
        if (!form.year) newErrors.year = "Year is required";
        if (!form.make) newErrors.make = "Make is required";
        if (!form.model.trim()) newErrors.model = "Model is required";
        if (!form.title.trim()) newErrors.title = "Title is required";
        if (form.vin && form.vin.length !== 17) newErrors.vin = "VIN must be 17 characters";
        break;
      case 1: // Specs
        // No strictly required fields, but engine is recommended
        break;
      case 2: // Condition
        break;
      case 3: // Photos
        {
          const uploadedCategories = new Set(form.photos.map((p) => p.category));
          const missingRequired = REQUIRED_PHOTO_CATEGORIES.filter(
            (cat) => !uploadedCategories.has(cat.key)
          );
          if (missingRequired.length > 0) {
            newErrors.photos = `Missing required photos: ${missingRequired.map((c) => c.label).join(", ")}`;
          }
        }
        break;
      case 4: // Pricing
        if (!form.startingBid || dollarsToCents(form.startingBid) <= 0) {
          newErrors.startingBid = "Starting bid is required and must be greater than $0";
        }
        if (form.hasReserve && (!form.reservePrice || dollarsToCents(form.reservePrice) <= 0)) {
          newErrors.reservePrice = "Reserve price is required when reserve is enabled";
        }
        if (
          form.hasReserve &&
          form.reservePrice &&
          form.startingBid &&
          dollarsToCents(form.reservePrice) <= dollarsToCents(form.startingBid)
        ) {
          newErrors.reservePrice = "Reserve price must be higher than starting bid";
        }
        if (form.hasBuyNow && (!form.buyNowPrice || dollarsToCents(form.buyNowPrice) <= 0)) {
          newErrors.buyNowPrice = "Buy Now price is required when enabled";
        }
        if (
          form.hasBuyNow &&
          form.buyNowPrice &&
          form.hasReserve &&
          form.reservePrice &&
          dollarsToCents(form.buyNowPrice) <= dollarsToCents(form.reservePrice)
        ) {
          newErrors.buyNowPrice = "Buy Now price must be higher than reserve price";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        title: form.title,
        make: form.make,
        model: form.model,
        year: parseInt(form.year, 10),
        vin: form.vin || null,
        mileage: form.mileage ? parseInt(form.mileage.replace(/,/g, ""), 10) : null,
        locationCity: form.locationCity || null,
        locationState: form.locationState || null,
        locationZip: form.locationZip || null,

        engineMake: form.engineMake || null,
        engineModel: form.engineModel || null,
        engineHP: form.engineHP ? parseInt(form.engineHP, 10) : null,
        transmissionType: form.transmissionType || null,
        transmissionModel: form.transmissionModel || null,
        axleConfiguration: form.axleConfiguration || null,
        suspensionType: form.suspensionType || null,
        wheelbase: form.wheelbase || null,
        sleeperType: form.sleeperType || null,
        fifthWheelType: form.fifthWheelType || null,
        fuelType: form.fuelType || null,
        emissionsStandard: form.emissionsStandard || null,
        carbCompliant: form.carbCompliant,
        driveTrain: form.driveTrain || null,
        exteriorColor: form.exteriorColor || null,
        interiorCondition: form.interiorCondition || null,

        tireCondition: form.tireCondition || null,
        tireBrand: form.tireBrand || null,
        tireSize: form.tireSize || null,
        brakeCondition: form.brakeCondition || null,

        dpfStatus: form.dpfStatus || null,
        egrStatus: form.egrStatus || null,
        aftertreatmentNotes: form.aftertreatmentNotes || null,
        description: form.description || null,

        noDamage: form.noDamage,
        knownIssues: form.knownIssues || null,

        maintenanceRecords: form.maintenanceRecords
          .filter((r) => r.type)
          .map((r) => ({
            type: r.type,
            description: r.description || null,
            mileageAtService: r.mileageAtService
              ? parseInt(r.mileageAtService.replace(/,/g, ""), 10)
              : null,
            datePerformed: r.datePerformed || null,
            shopName: r.shopName || null,
            documentUrl: null, // Placeholder until S3 upload
          })),

        // Photos sent as placeholder URLs until S3 is implemented
        photos: form.photos.map((p, i) => ({
          url: `placeholder-${p.category}-${i}`,
          category: p.category,
          sortOrder: i,
        })),

        startingBid: dollarsToCents(form.startingBid),
        hasReserve: form.hasReserve,
        reservePrice: form.hasReserve ? dollarsToCents(form.reservePrice) : null,
        buyNowPrice: form.hasBuyNow ? dollarsToCents(form.buyNowPrice) : null,
        auctionDurationDays: parseInt(form.auctionDurationDays, 10),
        listingTier: form.listingTier,
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create listing");
      }

      const listing = await res.json();
      router.push(`/dashboard/listings/${listing.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step Indicator ────────────────────────────────────────────────────────

  const renderStepIndicator = () => (
    <nav className="mb-8">
      {/* Desktop step indicator */}
      <ol className="hidden md:flex items-center w-full">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li
              key={step.label}
              className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}
            >
              <button
                type="button"
                onClick={() => goToStep(index)}
                disabled={index > currentStep}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isCompleted
                    ? "text-green-600 cursor-pointer hover:text-green-700"
                    : isCurrent
                      ? "text-brand-600"
                      : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "border-green-600 bg-green-50"
                      : isCurrent
                        ? "border-brand-600 bg-brand-50"
                        : "border-gray-300 bg-white"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <span className="hidden lg:inline">{step.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${
                    isCompleted ? "bg-green-600" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile step indicator */}
      <div className="flex md:hidden items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          Step {currentStep + 1} of {STEPS.length}
        </span>
        <span className="text-sm font-semibold text-brand-600">
          {STEPS[currentStep].label}
        </span>
      </div>
      <div className="mt-2 md:hidden flex gap-1">
        {STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index < currentStep
                ? "bg-green-500"
                : index === currentStep
                  ? "bg-brand-600"
                  : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </nav>
  );

  // ─── Step 1: Basic Info ────────────────────────────────────────────────────

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Start with the essential details about your truck.
        </p>
      </div>

      <Input
        id="title"
        label="Listing Title *"
        placeholder="e.g. 2019 Freightliner Cascadia 126 — Low Miles, Clean"
        value={form.title}
        onChange={(e) => updateField("title", e.target.value)}
        error={errors.title}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          id="year"
          label="Year *"
          options={YEAR_OPTIONS}
          placeholder="Select year"
          value={form.year}
          onChange={(e) => updateField("year", e.target.value)}
          error={errors.year}
        />
        <Select
          id="make"
          label="Make *"
          options={MAKE_OPTIONS}
          placeholder="Select make"
          value={form.make}
          onChange={(e) => updateField("make", e.target.value)}
          error={errors.make}
        />
        <Input
          id="model"
          label="Model *"
          placeholder="e.g. Cascadia 126"
          value={form.model}
          onChange={(e) => updateField("model", e.target.value)}
          error={errors.model}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="vin"
          label="VIN"
          placeholder="17-character VIN"
          value={form.vin}
          onChange={(e) => updateField("vin", e.target.value.toUpperCase())}
          maxLength={17}
          error={errors.vin}
        />
        <Input
          id="mileage"
          label="Mileage"
          placeholder="e.g. 450000"
          type="text"
          inputMode="numeric"
          value={form.mileage}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            updateField("mileage", raw ? parseInt(raw, 10).toLocaleString() : "");
          }}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Truck Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="locationCity"
            label="City"
            placeholder="e.g. Dallas"
            value={form.locationCity}
            onChange={(e) => updateField("locationCity", e.target.value)}
          />
          <Select
            id="locationState"
            label="State"
            options={STATE_OPTIONS}
            placeholder="Select state"
            value={form.locationState}
            onChange={(e) => updateField("locationState", e.target.value)}
          />
          <Input
            id="locationZip"
            label="ZIP Code"
            placeholder="e.g. 75201"
            value={form.locationZip}
            onChange={(e) => updateField("locationZip", e.target.value)}
            maxLength={5}
          />
        </div>
      </div>
    </div>
  );

  // ─── Step 2: Specs & Details ───────────────────────────────────────────────

  const renderSpecsDetails = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Specs & Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Provide detailed specifications. More details mean more confident bidders.
        </p>
      </div>

      {/* Engine */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
          Engine & Powertrain
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            id="engineMake"
            label="Engine Make"
            options={ENGINE_MAKE_OPTIONS}
            placeholder="Select engine make"
            value={form.engineMake}
            onChange={(e) => updateField("engineMake", e.target.value)}
          />
          <Input
            id="engineModel"
            label="Engine Model"
            placeholder="e.g. X15"
            value={form.engineModel}
            onChange={(e) => updateField("engineModel", e.target.value)}
          />
          <Input
            id="engineHP"
            label="Horsepower"
            placeholder="e.g. 500"
            type="text"
            inputMode="numeric"
            value={form.engineHP}
            onChange={(e) =>
              updateField("engineHP", e.target.value.replace(/[^0-9]/g, ""))
            }
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Select
            id="transmissionType"
            label="Transmission Type"
            options={TRANSMISSION_OPTIONS}
            placeholder="Select type"
            value={form.transmissionType}
            onChange={(e) => updateField("transmissionType", e.target.value as TransmissionType)}
          />
          <Input
            id="transmissionModel"
            label="Transmission Model"
            placeholder="e.g. Eaton Fuller 18-speed"
            value={form.transmissionModel}
            onChange={(e) => updateField("transmissionModel", e.target.value)}
          />
          <Select
            id="driveTrain"
            label="Drive Train"
            options={DRIVETRAIN_OPTIONS}
            placeholder="Select"
            value={form.driveTrain}
            onChange={(e) => updateField("driveTrain", e.target.value as DriveTrain)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Select
            id="fuelType"
            label="Fuel Type"
            options={FUEL_OPTIONS}
            placeholder="Select fuel type"
            value={form.fuelType}
            onChange={(e) => updateField("fuelType", e.target.value as FuelType)}
          />
          <Select
            id="axleConfiguration"
            label="Axle Configuration"
            options={AXLE_OPTIONS}
            placeholder="Select axle config"
            value={form.axleConfiguration}
            onChange={(e) =>
              updateField("axleConfiguration", e.target.value as AxleConfiguration)
            }
          />
        </div>
      </div>

      {/* Cab & Chassis */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
          Cab & Chassis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            id="sleeperType"
            label="Sleeper Type"
            options={SLEEPER_OPTIONS}
            placeholder="Select sleeper"
            value={form.sleeperType}
            onChange={(e) => updateField("sleeperType", e.target.value as SleeperType)}
          />
          <Input
            id="wheelbase"
            label="Wheelbase"
            placeholder='e.g. 228"'
            value={form.wheelbase}
            onChange={(e) => updateField("wheelbase", e.target.value)}
          />
          <Input
            id="suspensionType"
            label="Suspension Type"
            placeholder="e.g. Air Ride"
            value={form.suspensionType}
            onChange={(e) => updateField("suspensionType", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Input
            id="fifthWheelType"
            label="Fifth Wheel Type"
            placeholder="e.g. Sliding"
            value={form.fifthWheelType}
            onChange={(e) => updateField("fifthWheelType", e.target.value)}
          />
          <Input
            id="exteriorColor"
            label="Exterior Color"
            placeholder="e.g. White"
            value={form.exteriorColor}
            onChange={(e) => updateField("exteriorColor", e.target.value)}
          />
          <Input
            id="interiorCondition"
            label="Interior Condition"
            placeholder="e.g. Good — normal wear"
            value={form.interiorCondition}
            onChange={(e) => updateField("interiorCondition", e.target.value)}
          />
        </div>
      </div>

      {/* Emissions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
          Emissions & Aftertreatment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="emissionsStandard"
            label="Emissions Standard"
            options={EMISSIONS_OPTIONS}
            placeholder="Select standard"
            value={form.emissionsStandard}
            onChange={(e) =>
              updateField("emissionsStandard", e.target.value as EmissionsStandard)
            }
          />
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer h-10">
              <input
                type="checkbox"
                checked={form.carbCompliant}
                onChange={(e) => updateField("carbCompliant", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700">CARB Compliant</span>
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Input
            id="dpfStatus"
            label="DPF Status"
            placeholder="e.g. Recently cleaned at 400k"
            value={form.dpfStatus}
            onChange={(e) => updateField("dpfStatus", e.target.value)}
          />
          <Input
            id="egrStatus"
            label="EGR Status"
            placeholder="e.g. Functioning, no codes"
            value={form.egrStatus}
            onChange={(e) => updateField("egrStatus", e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Textarea
            id="aftertreatmentNotes"
            label="Aftertreatment Notes"
            placeholder="Any additional notes about DEF system, DPF regens, delete status, etc."
            value={form.aftertreatmentNotes}
            onChange={(e) => updateField("aftertreatmentNotes", e.target.value)}
          />
        </div>
      </div>

      {/* Tires & Brakes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
          Tires & Brakes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="tireCondition"
            label="Tire Condition"
            placeholder="e.g. 80% tread remaining"
            value={form.tireCondition}
            onChange={(e) => updateField("tireCondition", e.target.value)}
          />
          <Input
            id="tireBrand"
            label="Tire Brand"
            placeholder="e.g. Michelin"
            value={form.tireBrand}
            onChange={(e) => updateField("tireBrand", e.target.value)}
          />
          <Input
            id="tireSize"
            label="Tire Size"
            placeholder="e.g. 295/75R22.5"
            value={form.tireSize}
            onChange={(e) => updateField("tireSize", e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Input
            id="brakeCondition"
            label="Brake Condition"
            placeholder="e.g. New pads and drums at 380k"
            value={form.brakeCondition}
            onChange={(e) => updateField("brakeCondition", e.target.value)}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Textarea
          id="description"
          label="Full Description"
          placeholder="Tell buyers about this truck. What makes it stand out? Recent work done? Why are you selling?"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="min-h-[120px]"
        />
      </div>
    </div>
  );

  // ─── Step 3: Condition & Maintenance ───────────────────────────────────────

  const renderCondition = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Condition & Maintenance</h2>
        <p className="mt-1 text-sm text-gray-500">
          Honesty builds trust. Disclose any issues and share maintenance history.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.noDamage}
              onChange={(e) => updateField("noDamage", e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                No known damage or mechanical issues
              </span>
              <p className="text-xs text-gray-500">
                Uncheck if there are any issues to disclose
              </p>
            </div>
          </label>
        </div>

        {!form.noDamage && (
          <Textarea
            id="knownIssues"
            label="Known Issues"
            placeholder="Describe any damage, mechanical issues, warning lights, needed repairs, etc."
            value={form.knownIssues}
            onChange={(e) => updateField("knownIssues", e.target.value)}
            className="min-h-[100px]"
          />
        )}
      </div>

      {/* Maintenance Records */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Maintenance Records</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add service history to increase buyer confidence
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addMaintenanceRecord}>
            + Add Record
          </Button>
        </div>

        {form.maintenanceRecords.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <Wrench className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No maintenance records added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={addMaintenanceRecord}
            >
              Add First Record
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {form.maintenanceRecords.map((record, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Record #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMaintenanceRecord(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    id={`maint-type-${index}`}
                    label="Service Type"
                    options={MAINTENANCE_TYPE_OPTIONS}
                    placeholder="Select type"
                    value={record.type}
                    onChange={(e) => updateMaintenanceRecord(index, "type", e.target.value)}
                  />
                  <Input
                    id={`maint-shop-${index}`}
                    label="Shop Name"
                    placeholder="e.g. TA Truck Service"
                    value={record.shopName}
                    onChange={(e) =>
                      updateMaintenanceRecord(index, "shopName", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id={`maint-mileage-${index}`}
                    label="Mileage at Service"
                    placeholder="e.g. 350000"
                    value={record.mileageAtService}
                    onChange={(e) =>
                      updateMaintenanceRecord(index, "mileageAtService", e.target.value)
                    }
                  />
                  <Input
                    id={`maint-date-${index}`}
                    label="Date Performed"
                    type="date"
                    value={record.datePerformed}
                    onChange={(e) =>
                      updateMaintenanceRecord(index, "datePerformed", e.target.value)
                    }
                  />
                </div>
                <Textarea
                  id={`maint-desc-${index}`}
                  label="Description"
                  placeholder="Details about the service performed"
                  value={record.description}
                  onChange={(e) =>
                    updateMaintenanceRecord(index, "description", e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── Step 4: Photos ────────────────────────────────────────────────────────

  const getPhotosForCategory = (categoryKey: string) =>
    form.photos.filter((p) => p.category === categoryKey);

  const isCategoryFulfilled = (categoryKey: string) =>
    form.photos.some((p) => p.category === categoryKey);

  const renderPhotos = () => {
    const allCategories = [
      ...REQUIRED_PHOTO_CATEGORIES.map((c) => ({ ...c, required: true })),
      ...OPTIONAL_PHOTO_CATEGORIES.map((c) => ({ ...c, required: false })),
    ];
    const fulfilledCount = REQUIRED_PHOTO_CATEGORIES.filter((c) =>
      isCategoryFulfilled(c.key)
    ).length;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload clear, well-lit photos. All required categories must have at least one
            photo.
          </p>
        </div>

        {/* Progress */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Required Photos</span>
            <span className="text-sm font-semibold text-gray-900">
              {fulfilledCount} / {REQUIRED_PHOTO_CATEGORIES.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all duration-300"
              style={{
                width: `${(fulfilledCount / REQUIRED_PHOTO_CATEGORIES.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {errors.photos && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{errors.photos}</p>
          </div>
        )}

        {/* Category Checklist & Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category list */}
          <div className="lg:col-span-1 space-y-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Categories</h3>
            <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1">
              {allCategories.map((cat) => {
                const fulfilled = isCategoryFulfilled(cat.key);
                const isSelected = selectedPhotoCategory === cat.key;
                const photoCount = getPhotosForCategory(cat.key).length;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedPhotoCategory(cat.key)}
                    className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-brand-50 border border-brand-200 text-brand-700"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    {fulfilled ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <Circle
                        className={`h-5 w-5 shrink-0 ${
                          cat.required ? "text-gray-300" : "text-gray-200"
                        }`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`block truncate ${cat.required ? "font-medium" : ""}`}
                      >
                        {cat.label}
                        {cat.required && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                    </div>
                    {photoCount > 0 && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {photoCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload area */}
          <div className="lg:col-span-2">
            {(() => {
              const activeCat = allCategories.find((c) => c.key === selectedPhotoCategory);
              const categoryPhotos = getPhotosForCategory(selectedPhotoCategory);

              return (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {activeCat?.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeCat?.description}
                    </p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                      dragOver
                        ? "border-brand-400 bg-brand-50"
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <Upload
                      className={`h-10 w-10 ${dragOver ? "text-brand-500" : "text-gray-300"}`}
                    />
                    <p className="mt-3 text-sm font-medium text-gray-700">
                      Drag & drop photos here
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      or click to browse files
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>

                  {/* Previews for this category */}
                  {categoryPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {categoryPhotos.map((photo) => {
                        const globalIndex = form.photos.indexOf(photo);
                        return (
                          <div key={globalIndex} className="group relative aspect-[4/3]">
                            <img
                              src={photo.preview}
                              alt={`${activeCat?.label} photo`}
                              className="h-full w-full rounded-lg object-cover border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(globalIndex)}
                              className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {categoryPhotos.length === 0 && (
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 p-3">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        No photos uploaded for this category yet
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // ─── Step 5: Pricing ───────────────────────────────────────────────────────

  const renderPricing = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Pricing & Auction Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set your auction parameters. All prices are in USD.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startingBid"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Starting Bid *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                $
              </span>
              <input
                id="startingBid"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 25000"
                value={form.startingBid}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  updateField("startingBid", raw ? formatDollar(raw) : "");
                }}
                className={`flex h-10 w-full rounded-md border bg-white pl-7 pr-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  errors.startingBid ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.startingBid && (
              <p className="mt-1 text-sm text-red-600">{errors.startingBid}</p>
            )}
          </div>

          <Select
            id="auctionDurationDays"
            label="Auction Duration"
            options={DURATION_OPTIONS}
            value={form.auctionDurationDays}
            onChange={(e) => updateField("auctionDurationDays", e.target.value)}
          />
        </div>

        {/* Reserve Price */}
        <div className="rounded-md border border-gray-200 p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasReserve}
              onChange={(e) => updateField("hasReserve", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Set Reserve Price</span>
              <p className="text-xs text-gray-500">
                The truck will not sell unless bidding reaches this hidden minimum
              </p>
            </div>
          </label>

          {form.hasReserve && (
            <div>
              <label
                htmlFor="reservePrice"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Reserve Price *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  $
                </span>
                <input
                  id="reservePrice"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 35000"
                  value={form.reservePrice}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    updateField("reservePrice", raw ? formatDollar(raw) : "");
                  }}
                  className={`flex h-10 w-full rounded-md border bg-white pl-7 pr-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    errors.reservePrice ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.reservePrice && (
                <p className="mt-1 text-sm text-red-600">{errors.reservePrice}</p>
              )}
            </div>
          )}
        </div>

        {/* Buy Now */}
        <div className="rounded-md border border-gray-200 p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasBuyNow}
              onChange={(e) => updateField("hasBuyNow", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                Enable Buy Now Price
              </span>
              <p className="text-xs text-gray-500">
                Allow buyers to purchase immediately at this fixed price
              </p>
            </div>
          </label>

          {form.hasBuyNow && (
            <div>
              <label
                htmlFor="buyNowPrice"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Buy Now Price *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  $
                </span>
                <input
                  id="buyNowPrice"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 50000"
                  value={form.buyNowPrice}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    updateField("buyNowPrice", raw ? formatDollar(raw) : "");
                  }}
                  className={`flex h-10 w-full rounded-md border bg-white pl-7 pr-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    errors.buyNowPrice ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.buyNowPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.buyNowPrice}</p>
              )}
            </div>
          )}
        </div>

        {/* Listing Tier */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Listing Tier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                form.listingTier === "STANDARD"
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="listingTier"
                value="STANDARD"
                checked={form.listingTier === "STANDARD"}
                onChange={() => updateField("listingTier", "STANDARD")}
                className="sr-only"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Standard</p>
                <p className="text-xs text-gray-500 mt-0.5">$99 listing fee</p>
                <p className="text-xs text-gray-400 mt-1">
                  Appears in search results and category pages
                </p>
              </div>
            </label>
            <label
              className={`flex cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                form.listingTier === "FEATURED"
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="listingTier"
                value="FEATURED"
                checked={form.listingTier === "FEATURED"}
                onChange={() => updateField("listingTier", "FEATURED")}
                className="sr-only"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Featured{" "}
                  <span className="ml-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
                    Popular
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">$299 listing fee</p>
                <p className="text-xs text-gray-400 mt-1">
                  Homepage spotlight, priority placement, and social promotion
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Step 6: Review & Submit ───────────────────────────────────────────────

  const renderReview = () => {
    const fulfilledCount = REQUIRED_PHOTO_CATEGORIES.filter((c) =>
      isCategoryFulfilled(c.key)
    ).length;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review your listing details before submission. Your listing will be reviewed by
            our team before going live.
          </p>
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{submitError}</p>
          </div>
        )}

        {/* Basic Info Summary */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Basic Info</h3>
            <button
              type="button"
              onClick={() => goToStep(0)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Edit
            </button>
          </div>
          <div className="px-4 py-3 space-y-2">
            <ReviewRow label="Title" value={form.title} />
            <ReviewRow label="Year / Make / Model" value={`${form.year} ${form.make} ${form.model}`} />
            <ReviewRow label="VIN" value={form.vin || "Not provided"} />
            <ReviewRow label="Mileage" value={form.mileage ? `${form.mileage} miles` : "Not provided"} />
            <ReviewRow
              label="Location"
              value={
                [form.locationCity, form.locationState, form.locationZip]
                  .filter(Boolean)
                  .join(", ") || "Not provided"
              }
            />
          </div>
        </div>

        {/* Specs Summary */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Specs & Details</h3>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Edit
            </button>
          </div>
          <div className="px-4 py-3 space-y-2">
            <ReviewRow
              label="Engine"
              value={
                [form.engineMake, form.engineModel, form.engineHP ? `${form.engineHP}HP` : ""]
                  .filter(Boolean)
                  .join(" ") || "Not specified"
              }
            />
            <ReviewRow
              label="Transmission"
              value={
                [
                  TRANSMISSION_OPTIONS.find((o) => o.value === form.transmissionType)?.label,
                  form.transmissionModel,
                ]
                  .filter(Boolean)
                  .join(" — ") || "Not specified"
              }
            />
            <ReviewRow
              label="Axle / Drivetrain"
              value={
                [
                  AXLE_OPTIONS.find((o) => o.value === form.axleConfiguration)?.label,
                  DRIVETRAIN_OPTIONS.find((o) => o.value === form.driveTrain)?.label,
                ]
                  .filter(Boolean)
                  .join(" / ") || "Not specified"
              }
            />
            <ReviewRow
              label="Sleeper"
              value={
                SLEEPER_OPTIONS.find((o) => o.value === form.sleeperType)?.label ||
                "Not specified"
              }
            />
            <ReviewRow
              label="Emissions"
              value={
                EMISSIONS_OPTIONS.find((o) => o.value === form.emissionsStandard)?.label ||
                "Not specified"
              }
            />
            {form.carbCompliant && <ReviewRow label="CARB" value="Compliant" />}
          </div>
        </div>

        {/* Condition Summary */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Condition</h3>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Edit
            </button>
          </div>
          <div className="px-4 py-3 space-y-2">
            <ReviewRow
              label="Damage"
              value={form.noDamage ? "No known issues" : "Issues disclosed"}
            />
            {!form.noDamage && form.knownIssues && (
              <ReviewRow label="Known Issues" value={form.knownIssues} />
            )}
            <ReviewRow
              label="Maintenance Records"
              value={`${form.maintenanceRecords.length} record(s)`}
            />
          </div>
        </div>

        {/* Photos Summary */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Photos</h3>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Edit
            </button>
          </div>
          <div className="px-4 py-3 space-y-2">
            <ReviewRow label="Total Photos" value={`${form.photos.length}`} />
            <ReviewRow
              label="Required Categories"
              value={`${fulfilledCount} / ${REQUIRED_PHOTO_CATEGORIES.length} complete`}
            />
          </div>
          {form.photos.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto py-1">
                {form.photos.slice(0, 8).map((photo, i) => (
                  <img
                    key={i}
                    src={photo.preview}
                    alt={`Preview ${i + 1}`}
                    className="h-16 w-20 shrink-0 rounded object-cover border border-gray-200"
                  />
                ))}
                {form.photos.length > 8 && (
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs text-gray-500">
                    +{form.photos.length - 8} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Pricing</h3>
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Edit
            </button>
          </div>
          <div className="px-4 py-3 space-y-2">
            <ReviewRow label="Starting Bid" value={`$${form.startingBid}`} />
            {form.hasReserve && (
              <ReviewRow label="Reserve Price" value={`$${form.reservePrice} (hidden)`} />
            )}
            {form.hasBuyNow && (
              <ReviewRow label="Buy Now Price" value={`$${form.buyNowPrice}`} />
            )}
            <ReviewRow
              label="Duration"
              value={`${form.auctionDurationDays} days`}
            />
            <ReviewRow
              label="Listing Tier"
              value={form.listingTier === "FEATURED" ? "Featured ($299)" : "Standard ($99)"}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Your listing will be reviewed before going live
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Our team typically reviews listings within 24 hours. You will receive an
                email notification when your listing is approved or if changes are needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderSpecsDetails();
      case 2:
        return renderCondition();
      case 3:
        return renderPhotos();
      case 4:
        return renderPricing();
      case 5:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Create New Listing
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            List your semi truck for auction on RigBid
          </p>
        </div>

        {renderStepIndicator()}

        {/* Step Content */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 sm:p-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={goBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {currentStep < STEPS.length - 1 && (
              <Button type="button" onClick={goNext}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            {currentStep === STEPS.length - 1 && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[160px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </span>
                ) : (
                  "Submit for Review"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Review Row Helper ───────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right font-medium truncate">{value}</span>
    </div>
  );
}
