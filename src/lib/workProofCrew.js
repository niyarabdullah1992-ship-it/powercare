export const EMPTY_PERSON = { name: "", phone: "", id: "", title: "" };

export const EMPTY_VEHICLE = {
  maker: "", model: "", type: "", year: "", plateLetters: "", plateNumbers: "",
};

const CREW_LIMIT = 12;

export function normalizePerson(raw = {}) {
  return {
    name: String(raw.name || raw.personName || "").trim(),
    phone: String(raw.phone || raw.personPhone || "").trim(),
    id: String(raw.id || raw.personId || "").trim(),
    title: String(raw.title || raw.personTitle || "").trim(),
  };
}

export function normalizeVehicle(raw = {}) {
  const plate = String(raw.plate || "").trim();
  return {
    maker: String(raw.maker || raw.make || "").trim(),
    model: String(raw.model || "").trim(),
    type: String(raw.type || "").trim(),
    year: String(raw.year || "").trim(),
    plateLetters: String(raw.plateLetters || "").trim(),
    plateNumbers: String(raw.plateNumbers || "").trim(),
    plate,
  };
}

export function isVehicleFilled(vehicle) {
  const item = normalizeVehicle(vehicle);
  return Boolean(item.maker || item.model || item.type || item.year || item.plateLetters || item.plateNumbers || item.plate);
}

export function cleanedPeople(list) {
  return (Array.isArray(list) ? list : []).map(normalizePerson).filter((person) => person.name).slice(0, CREW_LIMIT);
}

export function cleanedVehicles(list) {
  return (Array.isArray(list) ? list : []).map(normalizeVehicle).filter(isVehicleFilled).slice(0, CREW_LIMIT);
}

export function peopleFromProof(proof, fallbackUser) {
  const fromList = cleanedPeople(proof?.people);
  if (fromList.length) return fromList;
  const one = normalizePerson({
    name: proof?.personName || fallbackUser?.name || "",
    phone: proof?.personPhone || fallbackUser?.phone || "",
    id: proof?.personId || "",
    title: proof?.personTitle || fallbackUser?.position || "",
  });
  return [one.name || fallbackUser?.name ? {
    ...one,
    name: one.name || String(fallbackUser?.name || "").trim(),
    phone: one.phone || String(fallbackUser?.phone || "").trim(),
    title: one.title || String(fallbackUser?.position || "").trim(),
  } : { ...EMPTY_PERSON }];
}

export function vehiclesFromProof(proof) {
  const fromList = cleanedVehicles(proof?.vehicles);
  if (fromList.length) return fromList;
  if (proof?.vehicle && isVehicleFilled(proof.vehicle)) return [normalizeVehicle(proof.vehicle)];
  return [{ ...EMPTY_VEHICLE }];
}

export function formPeople(form) {
  if (Array.isArray(form?.people) && form.people.length) {
    return form.people.map((person) => ({ ...EMPTY_PERSON, ...person }));
  }
  return [{
    name: form?.personName || "",
    phone: form?.personPhone || "",
    id: form?.personId || "",
    title: form?.personTitle || "",
  }];
}

export function formVehicles(form) {
  if (Array.isArray(form?.vehicles) && form.vehicles.length) {
    return form.vehicles.map((vehicle) => ({ ...EMPTY_VEHICLE, ...normalizeVehicle(vehicle) }));
  }
  return [{ ...EMPTY_VEHICLE, ...normalizeVehicle(form?.vehicle || {}) }];
}

export function workProofCrewFields(form) {
  const people = cleanedPeople(formPeople(form));
  const vehicles = cleanedVehicles(formVehicles(form));
  const first = people[0] || { ...EMPTY_PERSON };
  return {
    ok: Boolean(first.name),
    errorAr: "أدخل اسم منفذ واحد على الأقل.",
    errorEn: "Enter at least one worker name.",
    fields: {
      people,
      vehicles,
      personName: first.name,
      personPhone: first.phone,
      personId: first.id,
      personTitle: first.title,
      vehicle: vehicles[0] || { ...EMPTY_VEHICLE },
    },
  };
}

export function canAddCrewItem(list) {
  return (Array.isArray(list) ? list.length : 0) < CREW_LIMIT;
}
