import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileModal from './ProfileModal';
import './UserProfile.css';
import './ProfileModal.css';
import { FaUserCircle } from 'react-icons/fa';

const UserProfile = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <>
            <div className="user-profile-container" ref={dropdownRef}>
                <button onClick={() => setIsOpen(!isOpen)} className="profile-trigger">
                    <FaUserCircle size={28} />
                </button>

                {isOpen && (
                    <div className="profile-dropdown">
                        <ul>
                            <li onClick={() => navigate('/')}>Home</li>
                            <li onClick={() => {
                                setIsProfileModalOpen(true);
                                setIsOpen(false); // Close dropdown when opening modal
                            }}>Profile</li>
                            <li onClick={handleLogout}>Log Out</li>
                        </ul>
                    </div>
                )}
            </div>
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </>
    );
};

export default UserProfile;