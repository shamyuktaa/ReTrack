
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NotificationBell from "@/app/components/NotificationBell";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!


export default function WarehousePage() {
    const router = useRouter();
    const [bagID, setBagID] = useState<string>("");
    const [scanned, setScanned] = useState(false);
    const [retID, setRetID] = useState("");
    const [sealIntegrity, setSealIntegrity] = useState<string>("");
    
    // API-loaded data
    const [bagInfo, setBagInfo] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]); // bag items mapping

    // Modal states
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [issueText, setIssueText] = useState("");

    // Return inspection modal
    const [retModalOpen, setRetModalOpen] = useState(false);
    const [retDetails, setRetDetails] = useState<any>(null);
    const [retInBag, setRetInBag] = useState<boolean | null>(null);
    const [retBagItemId, setRetBagItemId] = useState<number | null>(null);
    const [retExpected, setRetExpected] = useState<string | null>(null);
    const [retStatus, setRetStatus] = useState<string | null>(null);
    const [finishModalOpen, setFinishModalOpen] = useState(false);

    // add missing
    const [confirmUnattendedOpen, setConfirmUnattendedOpen] = useState(false); 
    const [isUnattendedMarked, setIsUnattendedMarked] = useState(false); // State to track if the process has been run for this bag (local UI lock)

    // Finish bag models
    const [message, setMessage] = useState(false);
    // Corrected state setter name for consistency, though using original variable name below
    const [showConfirmModal, setshowConfirmModal] = useState(false); 
    const [isBagFinished, setIsBagFinished] = useState(false);

    const handleForwardToQC = async () => {
        // Get JWT from localStorage
        const token = localStorage.getItem("jwt"); 
        
        // Ensure you have a bagId (use the appropriate variable name)
        if (!bagID || !token) {
            alert("Error: Bag ID or authorization token is missing.");
            setFinishModalOpen(false);
            return;
        }

        try {
            const url = `${API_BASE_URL}/api/Warehouse/forward-to-qc/${bagID}`;
            
            const response = await fetch(url, {
                method: "POST", // Use POST method as this is a creation/action endpoint
                headers: {
                    "Content-Type": "application/json",
                    // Include the JWT for authorization
                    "Authorization": `Bearer ${token}` 
                },
                // The body can be empty if the API only needs the bagId from the URL
                body: JSON.stringify({}) 
            });

            if (!response.ok) {
                // Handle server errors (400, 500, etc.)
                const errorData = await response.json().catch(() => ({ message: "Unknown server error" }));
                throw new Error(errorData.message || `Failed with status: ${response.status}`);
            }

            // 2. Success Feedback
            alert("Bag sent for quality check successfully!");
            setFinishModalOpen(false);
            
            // 3. Optional: Trigger a refresh of the main table here if needed
            // refreshWarehouseData(); 

        } catch (error: any) {
            console.error("Error forwarding bag to QC:", error);
            //alert(`Failed to send bag to QC. Reason: ${error.message}`);
        }
    };

    // ------------------------------------
    // 1. New function to update Bag Status to 'Finished'
    // ------------------------------------
    const finishBagOnServer = async () => {
    const token = localStorage.getItem("jwt");
    if (!bagID || !token) {
        console.error("Cannot finish bag: ID or token missing.");
        return false;
    }

    try {
        const url = `${API_BASE_URL}/api/Bags/${bagID}/finish`;
        const response = await fetch(url, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Unknown server error" }));
            throw new Error(errorData.message || `Failed to finish bag on server with status: ${response.status}`);
        }
        console.log(`Bag ${bagID} status set to Finished on server.`);
        return true;

    } catch (error: any) {
        console.error("Error finalizing bag status:", error);
        
        // ** IMPORTANT FIX: Revert local state if the server call fails **
        setIsBagFinished(false); 
        setMessage(false); 
        
        // Corrected alert message format
        alert(`Failed to finalize bag on server. Reason: ${error.message}`);
        return false;
    }
    };

// ------------------------------------
// 2. Updated core logic for "Yes, Finish Bag"
// ------------------------------------
const markUnattendedParcels = async () => {
    // 1. Optimistically disable the button immediately to prevent double-clicks
    setIsBagFinished(true); 

    // 2. Filter for items that have no expected value yet
    const unattended = items.filter(
        (item) => item.expected === null || item.expected === undefined
    );

    // 3. Mark unattended items as 'Missing' and 'Report'
    if (unattended.length > 0) {
        await Promise.all(
            unattended.map(async (item) => {
                try {
                    // API calls to set Expected = "Missing" and Status = "Report"
                    const scanPromise = fetch(`${API_BASE_URL}/api/BagItems/${item.bagItemId}/scan`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify("Missing"),
                    });
                    const statusPromise = fetch(`${API_BASE_URL}/api/BagItems/${item.bagItemId}/status`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify("Report"),
                    });
                    await Promise.all([scanPromise, statusPromise]);
                } catch (err) {
                    console.error("Failed to update unattended parcel", item, err);
                }
            })
        );
    }

    // 4. Call the new API to set Bag.Status = 'Finished'
    // finishBagOnServer handles reverting setIsBagFinished(false) if it fails.
    const success = await finishBagOnServer(); 

    if (success) {
        // 5. If server updated successfully, ensure local data reflects it
        // We only need to fetch the bag info again to update bagInfo.status and confirm 'Finished'
        await fetchBag(); 
        
        // We should also refresh the items to show the updated 'Missing' status
        await fetchBagItems(); 

        // 6. Show local success message
        setMessage(true); 
    } else {
         // If `finishBagOnServer` failed, it already reverted `setIsBagFinished(false)` 
         // in its catch block, so no action needed here other than potentially closing the modal.
    }
    
    // Ensure the confirmation modal is closed
    setshowConfirmModal(false);
};
    // -------------------------
    // Fetch Bag + Items helpers
    // -------------------------
    const fetchBag = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/bags/${bagID}`);
            if (!res.ok) {
                alert("Bag not found");
                return;
            }
            const data = await res.json();
            setBagInfo(data);
            // ** PERSISTENCE CHECK **
            // If the Bag status is "Finished", disable the button
            if (data.status === "Finished") {
                setIsBagFinished(true);
                setMessage(true); // Also show the success message
            } else {
                setIsBagFinished(false);
                setMessage(false);
            }
        } catch (err) {
            console.error("Error fetching bag:", err);
            alert("Failed to fetch bag. See console.");
        }
    };

    const fetchBagItems = async () => {
        try {
            const bagitemsRes = await fetch(`${API_BASE_URL}/api/BagItems/bag/${bagID}`);
            if (!bagitemsRes.ok) {
                // No items for bag
                setItems([]);
                setScanned(true);
                return;
            }
            const data = await bagitemsRes.json(); // array of BagItem entities

            // Map to friendly UI shape and include unique _rowId
            const mapped = data.map((i: any, index: number) => ({
                _rowId: i.id ?? `bi-${index}-${Date.now()}`,
                bagItemId: i.id, // numeric DB id for API updates
                retId: i.returnId ?? null, // numeric Return.Id
                // Many of the DB fields use PascalCase; api returns camelCase - this was written against your earlier mapping
                // i.return may be null if not linked; guard it
                retCode: i.return?.returnCode ?? null,
                // product: i.return?.productCategory ?? "Unknown Product",
                product: i.return?.product?.name ?? "Unknown Product",
                expected: i.expected ?? null,
                status: i.status ?? (i.expected === "Yes" ? "Proceed" : "Report"),
            }));

            setItems(mapped);
            setScanned(true);
        } catch (error) {
            console.error("Error Loading bag items:", error);
            alert("Failed to load bag items. See console for details.");
        }
    };

    // Combined search for bag (used by Search button)
    const handleSearch = async () => {
        // Clear previous data
        setBagInfo(null);
        setItems([]);
        setScanned(false);
        // Reset finish status when searching for a new bag
        setIsBagFinished(false);
        setMessage(false); 

        await fetchBag();
        await fetchBagItems();
    };

    const handleRetIdSearch = async () => {
        if (!retID) {
            alert("Please enter a Return ID");
            return;
        }

        try {
            // 1️⃣ GET the Return by ID
            const res = await fetch(`${API_BASE_URL}/api/Returns/${retID}`);

            if (!res.ok) {
                alert("Return not found in Returns table.");
                return;
            }

            const ret = await res.json();
            setRetDetails(ret);

            // 2️⃣ Check if this return already exists inside this bag
            const found = items.find((it) => {
                if (it.retId && ret.id) return Number(it.retId) === Number(ret.id);
                if (it.retCode && ret.returnCode) return it.retCode === ret.returnCode;
                return false;
            });

            // 3️⃣ If return NOT in BagItems → auto insert
            if (!found) {
                console.log("Return not found in BagItems → inserting...");

                const createRes = await fetch(`${API_BASE_URL}/api/BagItems`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        bagId: Number(bagID),
                        returnId: ret.id,
                    }),
                });

                if (!createRes.ok) {
                    alert("Failed to insert Return into BagItems.");
                    return;
                }

                console.log("Inserted into BagItems successfully!");

                // Refresh the items in the bag
                await fetchBagItems();

                // Now set modal values for NEW item
                setRetInBag(false);
                setRetBagItemId(ret.id);
                setRetExpected("No");
                setRetStatus("Report");

                setRetModalOpen(true);
                return;
            }

            // 4️⃣ If return already exists inside bag → normal flow
            setRetInBag(true);
            setRetBagItemId(found.bagItemId ?? null);
            setRetExpected(found.expected ?? "Missing");
            setRetStatus(
                found.status ?? (found.expected === "Yes" ? "Proceed" : "Report")
            );

            setRetModalOpen(true);

        } catch (error) {
            console.error("Error in Return search:", error);
            alert("Unexpected error. See console.");
        }
    };

    const updateSealIntegrityApi = async (bagId: number, sealIntegrity: string) => {
        const url = `${API_BASE_URL}/api/BagItems/${bagId}/seal-integrity`; 
        //https://localhost:7147/api/BagItems/3/seal-integrity

        // The body is just the raw string status, quoted correctly for JSON
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(sealIntegrity) // Sends a raw string, e.g., "Intact"
        });
        
        return response;
    };

    // User answer: YES → set expected Yes / Proceed
    const handleRetAnswerYes = () => {
        setRetExpected("Yes");
        setRetStatus("Proceed");
    };

    // User answer: NO → set expected No / Report and open report modal
    const handleRetAnswerNo = () => {
        setRetExpected("No");
        setRetStatus("Report");

        // Immediately open report modal so user can describe issue
        // But keep the retModal open as well (we allow closing when they submit)
        // Save a shallow selectedItem to reuse report modal UI
        setSelectedItem({
            id: retDetails?.id ?? retDetails?.returnCode ?? "unknown",
            retCode: retDetails?.returnCode ?? null,
            bagId: bagInfo?.id ?? null,
        });
        // setReportModalOpen(true);
    };

    // Submit changes: updates DB according to scenario
    const handleRetSubmit = async () => {
        if (!retDetails) {
            alert("No return loaded.");
            return;
        }
        const returnId = retDetails.id;

        try {
            // If not in bag -> assign (this endpoint creates BagItem if missing)
            if (!retInBag) {
                const assignRes = await fetch(`${API_BASE_URL}/api/Returns/${returnId}/assign`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(Number(bagInfo?.id || bagID)), // send numeric bagId
                });

                if (!assignRes.ok) {
                    console.error("Assign failed", await assignRes.text());
                    alert("Failed to assign return to bag.");
                    return;
                }
                // After assign, refetch bag items to find the newly created bagitem
                await fetchBagItems();
                // find new bag item
                const newItem = items.find((it) => (it.retId && Number(it.retId) === Number(returnId)) || (it.retCode && it.retCode === retDetails.returnCode));
                if (newItem) {
                    setRetBagItemId(newItem.bagItemId);
                    setRetInBag(true);
                } else {
                    // If items state hasn't updated yet (race), fetch again from server and re-find
                    await fetchBagItems();
                    const newItem2 = items.find((it) => (it.retId && Number(it.retId) === Number(returnId)) || (it.retCode && it.retCode === retDetails.returnCode));
                    if (newItem2) {
                        setRetBagItemId(newItem2.bagItemId);
                        setRetInBag(true);
                    }
                }
            }

            // Now we should have a bagItemId (either existing or newly created)
            const bagItemId = retBagItemId ?? items.find((it) => (it.retId && Number(it.retId) === Number(returnId)) || (it.retCode && it.retCode === retDetails.returnCode))?.bagItemId;

            if (!bagItemId) {
                // If still not available, refetch & try again; if still missing, abort
                await fetchBagItems();
                const again = items.find((it) => (it.retId && Number(it.retId) === Number(returnId)) || (it.retCode && it.retCode === retDetails.returnCode));
                if (!again) {
                    alert("Could not find or create BagItem for this Return. Aborting.");
                    return;
                }
            }

            // Update expected via BagItems scan endpoint
            // expected value should be "Yes"|"No"|"Missing"
            const expectedToSend = retExpected ?? "No";
            const scanRes = await fetch(`${API_BASE_URL}/api/BagItems/${bagItemId}/scan`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(expectedToSend),
            });

            if (!scanRes.ok) {
                console.error("Failed scanning bag item", await scanRes.text());
                // not fatal — continue to attempt status update
            }

            // Update status via BagItems status endpoint
            const statusToSend = retStatus ?? (expectedToSend === "Yes" ? "Proceed" : "Report");
            const statusRes = await fetch(`${API_BASE_URL}/api/BagItems/${bagItemId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(statusToSend),
            });

            if (!statusRes.ok) {
                console.error("Failed updating status", await statusRes.text());
            }

            // Final refresh and close modal
            await fetchBagItems();
            setRetModalOpen(false);
            setRetDetails(null);
            setRetInBag(null);
            setRetBagItemId(null);
            setRetExpected(null);
            setRetStatus(null);

            alert("Return update applied successfully.");
        } catch (error) {
            console.error("Error during Ret submit:", error);
            alert("Failed to apply changes. See console.");
        }
    };

    // ----------------------------
    // BagItems select List Loading
    // ----------------------------
    type BagListItem = {
        id: number;
        bagCode: string;
        status: string;
    };

    const [bagsList, setBagsList] = useState<BagListItem[]>([]);

    // Function to load the list of bags assigned to the user's warehouse
const loadBagsList = async () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        console.error("User ID not found in local storage. Cannot filter bags by warehouse.");
        // Optional: set empty list or show an error state to the user
        setBagsList([]); 
        return;
    }

    try {

        // The server will use this ID to find the WarehouseId and filter the bags.
        const url = `${API_BASE_URL}/api/Bags/warehouse-staff/${userId}`;
        
        const res = await fetch(url);
        
        if (!res.ok) {
    // DO NOT throw error – just show empty list
    console.warn("Warehouse bags not available for this user yet.");
    setBagsList([]);
    return;
}

        
        const data = await res.json();
        setBagsList(data);
        
    } catch (err) {
        console.error("Failed to load bags list:", err);
        // Alert the user or update the UI with an error message
        alert(`Error loading bags:`);
    }
};

useEffect(() => {
    const role = localStorage.getItem("role");

    if (role === "WarehouseStaff") {
        loadBagsList();
    }
}, []);

    // -------------------------
    // Report handlers (existing)
    // -------------------------
    const handleStatusClick = (item: any) => {
        if (item.status === "Proceed") return;

        setSelectedItem(item);
        setIssueText("");
        setReportModalOpen(true);
    };

    const handleSaveReport = async () => {
        // Save the issue text to the main list (local) and post to API
        setItems((prev) =>
            prev.map((i) => (i.bagItemId === selectedItem.bagItemId ? { ...i, issueReason: issueText } : i))
        );

        // Create IssueReport in backend
        try {
            const body = {
                BagId: bagInfo?.id ?? Number(bagID),
                ReturnId: selectedItem.retId ?? null,
                Notes: issueText ?? "",
            };

            await fetch(`${API_BASE_URL}/api/IssueReports`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } catch (err) {
            console.error("Failed to create issue report:", err);
        }

        setReportModalOpen(false);
        setSelectedItem(null);
        setIssueText("");
    };

    // Utility to derive status visually
    const deriveStatus = (expected: string | null | undefined) => {
        return expected === "Yes" ? "Proceed" : "Report";
    };

    // UI helpers
    const getExpectedColor = (expected: string | null | undefined) => {
        switch (expected) {
            case "No":
                return "text-red-400 font-bold";
            case "Missing":
                return "text-amber-500 font-bold";
            default:
                return "text-green-500";
        }
    };
    
    const getStatusButtonStyles = (status: string | null | undefined) => {
        if (status === "Proceed")
            return "bg-green-500/10 text-green-400 border-green-500/20 cursor-default opacity-90";
        return "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 cursor-pointer animate-pulse";
    };

    // Function to handle the button click for Seal Integrity
    const handleUpdateSealIntegrity = async () => {
        if (!bagInfo?.id || !sealIntegrity) {
            alert("Please select a status (Intact/Broken) and ensure a bag is loaded.");
            return;
        }

        try {
            const response = await updateSealIntegrityApi(bagInfo.id, sealIntegrity);
            
            if (!response.ok) {
                // Handle non-200 responses
                const errorData = await response.json().catch(() => ({ message: "Unknown server error" }));
                throw new Error(errorData.message || `Failed with status: ${response.status}`);
            }

            // Update local bagInfo state after successful API call
            // This is important to reflect the change immediately in the UI without a full reload
            setBagInfo((prev: any) => ({ ...prev, sealIntegrity: sealIntegrity }));
            alert(`Bag ${bagInfo.bagCode} seal integrity updated to: ${sealIntegrity}`);

        } catch (error: any) {
            console.error("Error updating seal integrity:", error);
            alert(`Failed to update seal integrity. Reason: ${error.message}`);
        }
    };
    
    
    // Helper to count unattended items for the confirmation message
    const unattendedCount = items.filter(i => i.expected === null || i.expected === undefined).length;


    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header (kept same) */}
            <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 shadow-2xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Warehouse Staff</h1>
                                <p className="text-sm text-gray-500">Warehouse Management</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                                          <NotificationBell role="Warehouse" />

                            <button onClick={() => router.push("/warehouse/profile")}
                            className="w-20 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 
                            text-white flex items-center justify-center font-semibold
                            cursor-pointer hover:from-blue-400 hover:to-blue-600 transition-all duration-200"
                            >
                            W Staff
                            </button>
                            <div className="h-6 w-px bg-gray-700 mx-2"></div>

                            <button
                                onClick={() => { localStorage.removeItem("role"); router.replace("/"); }}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>
         
            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
              {/* Issue Reports Button */}
         <div onClick={() => router.push("/warehouse/reports")} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:bg-gray-800 transition-all mt-5 mb-8">
           <h2 className="text-xl font-bold">Issue Reports</h2>
           <p className="text-gray-400 mt-2">View reported issues</p>
         </div>
                {/* Scan Bag */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-10">
                    <h2 className="text-xl font-bold text-white">Scan Bag</h2>
                    <p className="text-gray-400 mt-2 mb-6">Select or scan Bag ID to view contents</p>
                    <div className="flex items-center gap-4">
                        <select
                            className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded"
                            value={bagID}
                            onChange={(e) => setBagID(e.target.value)}
                        >
                            <option value="">Select a Bag</option>

                            {bagsList.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.bagCode} 
                                </option>
                            ))}
                        </select>

                        <button onClick={handleSearch} className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-800">
                            Search
                        </button>
                    </div>
                </div>

                {/* BAG INFO + ITEMS */}
                {scanned && bagInfo && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left panel */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-6">Bag Information</h2>
                            <p className="text-gray-400 text-sm mb-1">Bag ID</p>
                            <p className="text-2xl font-bold">{bagInfo.bagCode ?? bagInfo.id}</p>

                            <p className="mt-4 text-gray-400 text-sm mb-1">PickUp Agent</p>
                            <p className="text-xl font-bold">{bagInfo.pickupAgentId ?? bagInfo.pickupAgent?.userId ?? "—"}</p>

                            <p className="mt-4 text-gray-400 text-sm mb-1">Warehouse ID</p>
                            <p >{bagInfo.warehouseId ?? "—"}</p>

                            <p className="mt-4 text-gray-400 text-sm mb-1">Status</p>
                            <p className="text-green-400">{bagInfo.status ?? "—"}</p>

                            <p className="mt-4 text-gray-400 text-sm mb-1">Total Items</p>
                            <p>{items.length}</p>

                            {/* 4. NEW: Seal Integrity Division */}
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mt-6">
                                <h4 className="text-lg font-bold mb-4">Set Bag Seal Status</h4>
                                
                                {/* Current Status Display */}
                                <p className="text-sm text-gray-400 mb-2">
                                    Current Status: <span className={`${bagInfo.sealIntegrity === 'Intact' ? 'text-green-400' : bagInfo.sealIntegrity === 'Broken' ? 'text-red-400' : 'text-gray-500'}`}>{bagInfo.sealIntegrity || "Not Set"}</span>
                                </p>

                                {/* Radio Buttons */}
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="sealIntegrity"
                                            value="Intact"
                                            checked={sealIntegrity === "Intact"}
                                            onChange={(e) => setSealIntegrity(e.target.value)}
                                            className="form-radio h-4 w-4 text-green-500 bg-gray-700 border-gray-600 focus:ring-green-500"
                                        />
                                        <span className="text-white">Intact</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="sealIntegrity"
                                            value="Broken"
                                            checked={sealIntegrity === "Broken"}
                                            onChange={(e) => setSealIntegrity(e.target.value)}
                                            className="form-radio h-4 w-4 text-red-500 bg-gray-700 border-gray-600 focus:ring-red-500"
                                        />
                                        <span className="text-white">Broken</span>
                                    </label>
                                </div>
                                
                                {/* Confirm Button */}
                                <button
                                    onClick={handleUpdateSealIntegrity}
                                    // Button is disabled if no choice is made OR if the choice matches the current saved state
                                    disabled={!sealIntegrity || bagInfo.sealIntegrity === sealIntegrity} 
                                    className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors
                                        ${
                                            !sealIntegrity || bagInfo.sealIntegrity === sealIntegrity
                                                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }
                                    `}
                                >
                                    Confirm Seal Status
                                </button>
                            </div>
                        </div>
                        

                        {/* Right panel */}
                        <div className={`lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6`}>
    
                        {/* NEW: Wrapper div to apply visual and functional disabling for all interaction
                            when isBagFinished is true.
                            - opacity-50: Visually dims the section.
                            - pointer-events-none: Prevents mouse/touch events on all children.
                        */}
                        <div className={isBagFinished ? 'opacity-50 pointer-events-none' : ''}>
        
                {/* Scan Parcels */}
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Enter Return ID"
                        value={retID}
                        onChange={(e) => setRetID(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 text-white p-3 rounded-xl"
                        // 1. Conditional disabled attribute for input
                        disabled={isBagFinished}
                    />
                    <button 
                        onClick={handleRetIdSearch} 
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-800"
                        // 2. Conditional disabled attribute for Search button
                        disabled={isBagFinished}
                    >
                        Search
                    </button>
                </div>

                <div className="flex justify-between items-center gap-4 mt-8">
                    <h2 className="text-xl font-bold mb-6">Expected Parcels in Bag</h2>
                </div>

                <table className="w-full mt-4">
                    <thead>
                        <tr className="text-gray-400 text-sm border-b border-gray-800">
                            <th className="py-2">Return ID</th>
                            <th>Product</th>
                            <th>Expected</th>
                            <th className="text-center">Status</th>
                        </tr>
                    </thead>

                    <tbody className={`text-center`}>
                        {items.map((item) => (
                            <tr key={item._rowId} className="border-b border-gray-800">
                                <td className="py-3">{item.retCode ?? item.retId ?? "N/A"}</td>
                                <td>{item.product}</td>
                                <td className={getExpectedColor(item.expected)}>{item.expected}</td>
                                <td className={`text-center`}>
                                    <button
                                        onClick={() => handleStatusClick(item)}
                                        className={`px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusButtonStyles(item.status)}`}
                                        // 3. Conditional disabled attribute for Status buttons
                                        disabled={isBagFinished}
                                    >
                                        {item.status}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    
                    {/* ... table closing tag and commented button are kept ... */}
                </table>
            </div> 
            {/* END of disabling wrapper div */}

            {/* SUCCESS MESSAGE BANNER - Remains outside the disabling div, as it should always show. */}
            {message && (
                <div className="mt-4 p-3 rounded-md bg-green-900/20 text-green-200 border border-green-700">
                    Bag Finished! Contents cannot be modified again.
                </div>
            )}

            {/* FINISH/FORWARD BUTTONS - These buttons are NOT wrapped in the disabling div. 
            - The 'Finish Bag' button already handles disabling via its 'disabled={isBagFinished}' prop.
            - The 'Forward to QC' button is typically an action that happens *after* the bag is finished (or as a next step), so it remains enabled (you might want to disable 'Forward to QC' if isBagFinished is FALSE, depending on your workflow).
            
            I'm leaving the 'Forward to QC' button *outside* the new wrapper for now, assuming it's a post-finish action.
            The "Finish Bag" button is also outside and already has its own disabling logic. 
            */}
            <div className="mt-8 text-right flex justify-end gap-4">
                {/* FINISH BAG BUTTON (Uses isBagFinished for disable/styling) - NO CHANGE NEEDED HERE */}
                <button
                    onClick={() => {
                        // Only show confirmation if the bag is not finished
                        if (!isBagFinished) {
                            setshowConfirmModal(true);
                        }
                    }}
                    className={`
                        px-6 py-3 rounded-xl transition duration-150 ease-in-out font-bold shadow-lg
                        ${
                            isBagFinished
                                ? 'bg-gray-700 cursor-not-allowed text-gray-400' // DISABLED STYLES
                                : 'bg-yellow-600 hover:bg-yellow-700 text-white' // ACTIVE STYLES
                        }
                    `}
                    disabled={isBagFinished}
                >
                    {isBagFinished ? 'Bag Finalized' : 'Finish Bag'}
                </button>
                <button
                    onClick={() => {
                        setFinishModalOpen(true);
                    }}
                    className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-800"
                    // If 'Forward to QC' should ONLY be available AFTER finishing, you might want to add: 
                    // disabled={!isBagFinished} 
                >
                    Forward to QC
                </button>
            </div>
</div>
                    </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* --- 1. CUSTOM CONFIRMATION MODAL (Controlled by showConfirmModal) --- */}
                {/* ------------------------------------------------------------- */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                            
                            <div className="p-6 border-b border-gray-800">
                                <h3 className="text-xl font-bold text-yellow-500">Confirm Bag Finalization</h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-lg text-gray-300">
                                    Are you sure you want to finish the bag?
                                </p>
                                
                                <p className="text-sm text-red-400 font-medium">
                                    {unattendedCount > 0 ? (
                                        <>
                                            **{unattendedCount} unattended parcel(s)** will be marked as **Missing** and contents cannot be modified again.
                                        </>
                                    ) : (
                                        "Contents cannot be modified again after submission."
                                    )}
                                </p>
                            </div>

                            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                                <button 
                                    onClick={() => setshowConfirmModal(false)} 
                                    className="px-4 py-2 text-gray-400 hover:text-white transition font-medium rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        // 1. Close confirm modal
                                        setshowConfirmModal(false);
                                        // 2. Execute main logic (which sets isBagFinished=true)
                                        markUnattendedParcels(); 
                                        // 3. Show success banner
                                        setMessage(true); 
                                    }} 
                                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold transition"
                                >
                                    Yes, Finish Bag
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* --- 2. CUSTOM SUCCESS MODAL (for QC Forward) --- */}
                {/* You may want to rename 'message' state to something like 'showSuccessBanner' to separate it from the modal */}
                {/* This is the existing QC modal, keeping it for context */}
                {/* {finishModalOpen && ...} */}
                 {finishModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
      <div className="flex justify-between p-6 border-b border-gray-800 flex justify-betshween items-center">
        <h3 className=" text-xl font-bold text-white">Proceed Items</h3>
        <button onClick={() => setFinishModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
        {items.filter(i => i.status === "Proceed").length === 0 ? (
          <p className="text-gray-400 text-center">No items marked as Proceed.</p>
        ) : (
          items
            .filter(i => i.status === "Proceed")
            .map((i) => (
              <div key={i._rowId} className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
                <p className="text-gray-300">
                  <span className="font-bold">Return ID:</span> {i.retCode}
                </p>
                <div className="flex justify-between">
                  <p className="text-gray-400 text-sm">{i.product}</p>
                <p className="text-green-400 text-sm text-right">{i.status}</p>

                </div>
                
              </div>
            ))
        )}
      </div>

      <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
        <button 
          onClick={() => setFinishModalOpen(false)} 
          className="px-4 py-2 text-gray-400 hover:text-white transition font-medium"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            handleForwardToQC();
          }}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
        >
          Forward
        </button>
      </div>
    </div>
  </div>
)}
                

                {/* RET INSPECTION MODAL (kept same) */}
                {retModalOpen && retDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
                            {/* ... (rest of retModalOpen JSX) ... */}
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Inspect Return</h3>
                                <button onClick={() => setRetModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Return ID</label>
                                        <input readOnly value={retDetails.returnCode ?? retDetails.id} className="w-full mt-2 bg-gray-800 border border-gray-700 text-gray-300 p-3 rounded-xl cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Product Category</label>
                                        <input readOnly value={retDetails.product.type ?? "—"} className="w-full mt-2 bg-gray-800 border border-gray-700 text-gray-300 p-3 rounded-xl cursor-not-allowed" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">In current bag?</label>
                                    <div className="mt-2 p-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300">
                                        {retInBag ? "Yes" : "No"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Does packaged product match original?</label>
                                    <div className="flex gap-4 mt-2">
                                        <button onClick={handleRetAnswerYes} className="px-4 py-2 hover:bg-green-600 rounded-xl font-semibold">YES</button>
                                        <button onClick={handleRetAnswerNo} className="px-4 py-2 hover:bg-red-600 rounded-xl font-semibold">NO</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Expected</label>
                                        <input readOnly value={retExpected ?? "—"} className="w-full mt-2 bg-gray-800 border border-gray-700 text-gray-300 p-3 rounded-xl cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</label>
                                        <input readOnly value={retStatus ?? "—"} className="w-full mt-2 bg-gray-800 border border-gray-700 text-gray-300 p-3 rounded-xl cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                                <button onClick={() => { setRetModalOpen(false); }} className="px-4 py-2 text-gray-400 hover:text-white transition font-medium">Cancel</button>
                                <button onClick={handleRetSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Submit</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* REPORT ISSUE MODAL (existing) */}
                {reportModalOpen && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Report Issue</h3>
                                <button onClick={() => setReportModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Bag ID</label>
                                        <input readOnly value={bagID} className="w-full mt-2 bg-gray-800 border border-gray-700 text-gray-300 p-3 rounded-xl cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Return ID</label>
                                        <input readOnly value={selectedItem.retCode ?? selectedItem.id} className="w-full mt-2 bg-gray-800 border border-gray-700 text-gray-300 p-3 rounded-xl cursor-not-allowed" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Status</label>
                                    <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 font-semibold flex items-center gap-2">
                                        {selectedItem.status ?? "Report"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Describe Issue</label>
                                    <textarea autoFocus rows={4} placeholder="Item missing/ Mismatch / etc..." value={issueText} onChange={(e) => setIssueText(e.target.value)} className="w-full mt-2 bg-gray-950 border border-gray-700 text-white p-3 rounded-xl outline-none transition"></textarea>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                                <button onClick={() => setReportModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition font-medium">Cancel</button>
                                <button onClick={handleSaveReport} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">Save Report</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}