import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

// ─── Enum display maps ────────────────────────────────────────────────────────

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  AUTO: "Automatic",
  AUTOMATED_MANUAL: "Automated Manual",
};

const AXLE_LABELS: Record<string, string> = {
  SINGLE: "Single",
  TANDEM: "Tandem",
  TRI_AXLE: "Tri-Axle",
};

const SLEEPER_LABELS: Record<string, string> = {
  NONE: "No Sleeper (Day Cab)",
  MID_ROOF: "Mid-Roof Sleeper",
  RAISED_ROOF: "Raised-Roof Sleeper",
  FLAT_TOP: "Flat Top Sleeper",
  CONDO: "Condo Sleeper",
};

const FUEL_LABELS: Record<string, string> = {
  DIESEL: "Diesel",
  CNG: "Compressed Natural Gas",
  ELECTRIC: "Electric",
};

const EMISSIONS_LABELS: Record<string, string> = {
  PRE_EPA07: "Pre-EPA 2007",
  EPA07: "EPA 2007",
  EPA10: "EPA 2010",
  EPA13: "EPA 2013",
  EPA17_PLUS: "EPA 2017+",
};

const DRIVETRAIN_LABELS: Record<string, string> = {
  FOUR_BY_TWO: "4x2",
  SIX_BY_FOUR: "6x4",
  SIX_BY_TWO: "6x2",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpecSheetProps {
  listing: {
    year: number;
    make: string;
    model: string;
    vin: string | null;
    mileage: number | null;
    engineMake: string | null;
    engineModel: string | null;
    engineHP: number | null;
    transmissionType: string | null;
    transmissionModel: string | null;
    axleConfiguration: string | null;
    suspensionType: string | null;
    wheelbase: string | null;
    sleeperType: string | null;
    fifthWheelType: string | null;
    fuelType: string | null;
    emissionsStandard: string | null;
    carbCompliant: boolean;
    driveTrain: string | null;
    exteriorColor: string | null;
    interiorCondition: string | null;
    tireCondition: string | null;
    tireBrand: string | null;
    tireSize: string | null;
    brakeCondition: string | null;
    dpfStatus: string | null;
    egrStatus: string | null;
    aftertreatmentNotes: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2.5 last:border-b-0">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 text-right">
        {value ?? <span className="text-gray-400">N/A</span>}
      </dd>
    </div>
  );
}

function SpecGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-navy-800">
        {title}
      </h4>
      <dl className="rounded-lg border border-gray-200 bg-white px-4">
        {children}
      </dl>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpecSheet({ listing }: SpecSheetProps) {
  const engineDisplay = [listing.engineMake, listing.engineModel]
    .filter(Boolean)
    .join(" ");

  const transmissionDisplay = [
    listing.transmissionType
      ? TRANSMISSION_LABELS[listing.transmissionType] ?? listing.transmissionType
      : null,
    listing.transmissionModel,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Powertrain */}
      <SpecGroup title="Powertrain">
        <SpecRow
          label="Engine"
          value={engineDisplay || null}
        />
        <SpecRow
          label="Horsepower"
          value={listing.engineHP ? `${formatNumber(listing.engineHP)} HP` : null}
        />
        <SpecRow
          label="Fuel Type"
          value={
            listing.fuelType
              ? FUEL_LABELS[listing.fuelType] ?? listing.fuelType
              : null
          }
        />
        <SpecRow
          label="Mileage"
          value={
            listing.mileage != null
              ? `${formatNumber(listing.mileage)} miles`
              : null
          }
        />
      </SpecGroup>

      {/* Drivetrain */}
      <SpecGroup title="Drivetrain">
        <SpecRow
          label="Transmission"
          value={transmissionDisplay || null}
        />
        <SpecRow
          label="Drive Configuration"
          value={
            listing.driveTrain
              ? DRIVETRAIN_LABELS[listing.driveTrain] ?? listing.driveTrain
              : null
          }
        />
        <SpecRow
          label="Rear Axle"
          value={
            listing.axleConfiguration
              ? AXLE_LABELS[listing.axleConfiguration] ?? listing.axleConfiguration
              : null
          }
        />
        <SpecRow label="Suspension" value={listing.suspensionType} />
        <SpecRow
          label="Wheelbase"
          value={listing.wheelbase ? `${listing.wheelbase}"` : null}
        />
      </SpecGroup>

      {/* Cab & Sleeper */}
      <SpecGroup title="Cab & Sleeper">
        <SpecRow
          label="Sleeper"
          value={
            listing.sleeperType
              ? SLEEPER_LABELS[listing.sleeperType] ?? listing.sleeperType
              : null
          }
        />
        <SpecRow label="Fifth Wheel" value={listing.fifthWheelType} />
        <SpecRow label="Exterior Color" value={listing.exteriorColor} />
        <SpecRow label="Interior Condition" value={listing.interiorCondition} />
      </SpecGroup>

      {/* Tires & Brakes */}
      <SpecGroup title="Tires & Brakes">
        <SpecRow label="Tire Condition" value={listing.tireCondition} />
        <SpecRow label="Tire Brand" value={listing.tireBrand} />
        <SpecRow label="Tire Size" value={listing.tireSize} />
        <SpecRow label="Brake Condition" value={listing.brakeCondition} />
      </SpecGroup>

      {/* Emissions */}
      <SpecGroup title="Emissions">
        <SpecRow
          label="Standard"
          value={
            listing.emissionsStandard
              ? EMISSIONS_LABELS[listing.emissionsStandard] ??
                listing.emissionsStandard
              : null
          }
        />
        <SpecRow
          label="CARB Compliant"
          value={
            <Badge variant={listing.carbCompliant ? "success" : "warning"}>
              {listing.carbCompliant ? "Yes" : "No"}
            </Badge>
          }
        />
        <SpecRow label="DPF Status" value={listing.dpfStatus} />
        <SpecRow label="EGR Status" value={listing.egrStatus} />
        {listing.aftertreatmentNotes && (
          <SpecRow
            label="Aftertreatment Notes"
            value={listing.aftertreatmentNotes}
          />
        )}
      </SpecGroup>

      {/* VIN */}
      <SpecGroup title="Identification">
        <SpecRow label="VIN" value={listing.vin} />
        <SpecRow
          label="Year / Make / Model"
          value={`${listing.year} ${listing.make} ${listing.model}`}
        />
      </SpecGroup>
    </div>
  );
}
