"use client";

import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchBar({ initialQuery }: { initialQuery: string }) {
    const router = useRouter();
    const [inputQuery, setInputQuery] = useState(initialQuery);

    useEffect(() => {
        setInputQuery(initialQuery);
    }, [initialQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputQuery.trim()) {
            router.push(`/${encodeURIComponent(inputQuery.trim())}`);
        }
    };

    return (
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, width: '100%' }}>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Search MAC Address or Vendor"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                slotProps={{
                    input: {
                        // startAdornment: (
                        //     <InputAdornment position="start">
                        //         <SearchIcon color="action" />
                        //     </InputAdornment>
                        // ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton type="submit" edge="end" color="primary">
                                    <SearchIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
            />
        </Box>
    );
}