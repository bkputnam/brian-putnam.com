import { fail } from "./fail.js";
async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('fail-msg');
        return;
    }
}
main();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBRWpDLEtBQUssVUFBVSxJQUFJO0lBQ2YsTUFBTSxPQUFPLEdBQUcsTUFBTSxTQUFTLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRSxDQUFDO0lBQ3RELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxFQUFFLGFBQWEsRUFBRSxDQUFDO0lBQzlDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNWLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqQixPQUFPO0lBQ1gsQ0FBQztBQUNMLENBQUM7QUFDRCxJQUFJLEVBQUUsQ0FBQyJ9