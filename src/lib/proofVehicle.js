// وصف موحّد للسيارة: الشركة والموديل وسنة الصنع وحروف وأرقام اللوحة.
export function vehicleLabel(vehicle = {}) {
  const plate = [vehicle.plateLetters, vehicle.plateNumbers].filter(Boolean).join(" ") || vehicle.plate || "";
  return [vehicle.maker || vehicle.make, vehicle.model, vehicle.type, vehicle.year, plate].filter(Boolean).join(" · ");
}