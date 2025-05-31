import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface TechnicianState {
    user_id?: number
    employee_id?: number
    first_name?: string
    last_name?: string
    full_name?: string
    email?: string
    department_id?: number
    plant_id?: number
    department?: {
        department_id: number
        department_name: string
    }
    plant?: {
        plant_id: number
        plant_name: string
    }
}

export interface EquipmentState {
    plant: string | number
    department: string | number
    location: string | number
    description: string
    serialNumber: string
    recallNumber?: string
    model: string
    manufacturer: string
    dueDate: string
    receivedBy: string | number
    location_name?: string // Optional field for location name display
    equipment_id?: number | null // Optional field for existing equipment
    existing?: boolean // Flag to indicate if equipment already exists
}

export interface CalibrationState {
    calibrationDate: string
    expectedDueDate: string
    dateOut: string
}

export interface TrackingRequestState {
    requestType: 'new' | 'routine'
    technician: TechnicianState | null
    equipment: EquipmentState
    calibration: CalibrationState
    confirmation_pin: string
    currentStep: string
    completedSteps: string[]
    isFormDirty: boolean
    scannedEmployee: TechnicianState | null
    receivedBy: TechnicianState | null
}

const initialState: TrackingRequestState = {
    requestType: 'new',
    technician: null, equipment: {
        plant: '',
        department: '',
        location: '',
        description: '',
        serialNumber: '',
        recallNumber: '',
        model: '',
        manufacturer: '',
        dueDate: '',
        receivedBy: '',
        location_name: '',
        equipment_id: null,
        existing: false
    },
    calibration: {
        calibrationDate: '',
        expectedDueDate: '',
        dateOut: ''
    },
    confirmation_pin: '',
    currentStep: 'technician',
    completedSteps: [],
    isFormDirty: false,
    scannedEmployee: null,
    receivedBy: null
}

const trackingRequestSlice = createSlice({
    name: 'trackingRequest',
    initialState,
    reducers: {
        setRequestType: (state, action: PayloadAction<'new' | 'routine'>) => {
            state.requestType = action.payload
            state.isFormDirty = true
        },
        setTechnician: (state, action: PayloadAction<TechnicianState | null>) => {
            state.technician = action.payload
            state.isFormDirty = true
        },
        updateEquipment: (state, action: PayloadAction<Partial<EquipmentState>>) => {
            // More careful handling to prevent field overwrites
            Object.keys(action.payload).forEach(key => {
                const value = action.payload[key as keyof EquipmentState];

                // Only update if the value is actually provided and meaningful
                if (value !== undefined && value !== null && value !== '') {
                    // Ensure plant, department, and location get proper numeric values
                    if (key === 'plant' || key === 'department' || key === 'location') {
                        const numericValue = typeof value === 'string' ? parseInt(value) : value;
                        if (!isNaN(numericValue as number) && numericValue !== 0) {
                            (state.equipment as any)[key] = numericValue;
                        }
                    } else {
                        (state.equipment as any)[key] = value;
                    }
                } else if (value === '' && key !== 'plant' && key !== 'department' && key !== 'location') {
                    // Allow empty strings for text fields but not for the critical ID fields
                    (state.equipment as any)[key] = value;
                }
            })
            state.isFormDirty = true
        },
        setEquipment: (state, action: PayloadAction<EquipmentState>) => {
            state.equipment = action.payload
            state.isFormDirty = true
        },
        updateCalibration: (state, action: PayloadAction<Partial<CalibrationState>>) => {
            state.calibration = { ...state.calibration, ...action.payload }
            state.isFormDirty = true
        },
        setCalibration: (state, action: PayloadAction<CalibrationState>) => {
            state.calibration = action.payload
            state.isFormDirty = true
        },
        updateConfirmationPin: (state, action: PayloadAction<string>) => {
            state.confirmation_pin = action.payload
            state.isFormDirty = true
        },
        setCurrentStep: (state, action: PayloadAction<string>) => {
            state.currentStep = action.payload
        },
        addCompletedStep: (state, action: PayloadAction<string>) => {
            if (!state.completedSteps.includes(action.payload)) {
                state.completedSteps.push(action.payload)
            }
        },
        setCompletedSteps: (state, action: PayloadAction<string[]>) => {
            state.completedSteps = action.payload
        },
        resetForm: (state) => {
            // Complete reset to initial state
            return {
                ...initialState,
                // Preserve current step if user wants to start over
                currentStep: 'technician',
                completedSteps: []
            }
        },
        markFormClean: (state) => {
            state.isFormDirty = false
        },
        setScannedEmployee: (state, action: PayloadAction<TechnicianState | null>) => {
            state.scannedEmployee = action.payload;
            state.isFormDirty = true;
        },
        setReceivedBy: (state, action: PayloadAction<TechnicianState | null>) => {
            state.receivedBy = action.payload;
            state.isFormDirty = true;
        },
        loadExistingData: (state, action: PayloadAction<{
            requestType: 'new' | 'routine';
            technician: TechnicianState | null;
            equipment: EquipmentState;
            receivedBy: TechnicianState | null;
        }>) => {
            // Load existing data without marking as dirty since it's pre-existing
            state.requestType = action.payload.requestType;
            state.technician = action.payload.technician;
            state.equipment = action.payload.equipment;
            state.receivedBy = action.payload.receivedBy;
            state.isFormDirty = false; // Important: don't mark as dirty when loading existing data
        },
        autoFillEmployeeData: (state, action: PayloadAction<TechnicianState>) => {
            // Auto-fill both scannedEmployee and receivedBy with current employee data
            state.scannedEmployee = action.payload;
            state.receivedBy = action.payload;

            // Also update the equipment receivedBy field
            state.equipment.receivedBy = action.payload.employee_id || action.payload.user_id || '';

            // Don't mark as dirty since this is automatic initialization
            state.isFormDirty = false;
        },
    }
})

export const {
    setRequestType,
    setTechnician,
    updateEquipment,
    setEquipment,
    updateCalibration,
    setCalibration,
    updateConfirmationPin,
    setCurrentStep,
    addCompletedStep,
    setCompletedSteps,
    resetForm,
    markFormClean,
    setScannedEmployee,
    setReceivedBy,
    loadExistingData,
    autoFillEmployeeData
} = trackingRequestSlice.actions

export default trackingRequestSlice.reducer
