/* The commuter list, with change notifications. Replaces the prototype's rebuild(). */
import { SAMPLE, type Person } from "./data";
import { loadPeople, savePeople } from "../lib/storage";

type Listener = (people: readonly Person[]) => void;

const uid = (prefix: string) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

let people: Person[] = loadPeople() ?? SAMPLE.map(p => ({ ...p, id: "" }));
people.forEach((p, i) => { if (!p.id) p.id = "p" + i + Math.random().toString(36).slice(2, 6); });
const listeners = new Set<Listener>();

function commit() {
  savePeople(people);
  listeners.forEach(fn => fn(people));
}

export const store = {
  get people(): readonly Person[] { return people; },
  subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); },
  add(p: Omit<Person, "id">): Person {
    const full = { ...p, id: uid("p") };
    people = [...people, full]; commit(); return full;
  },
  remove(id: string) { people = people.filter(p => p.id !== id); commit(); },
  reset() { people = SAMPLE.map(p => ({ ...p, id: uid("s") })); commit(); },
};
