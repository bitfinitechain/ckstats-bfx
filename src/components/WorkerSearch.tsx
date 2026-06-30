"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";


export function WorkerSearch() {
    const [address, setAddress] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (address.trim()) {
            router.push(`/workers/${address.trim()}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Search by worker address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-9 h-10 w-[250px] md:w-[400px] transition-all focus:w-[300px] md:focus:w-[450px]"
            />
        </form>
    );
}
