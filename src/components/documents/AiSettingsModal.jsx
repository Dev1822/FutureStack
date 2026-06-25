/**
 * AiSettingsModal — BYOK: save the user's Gemini API key once, encrypted server-side.
 */

import React, { useEffect, useState } from 'react';
import { FaBrain, FaKey, FaExternalLinkAlt } from 'react-icons/fa';
import Modal from '../common/Modal';
import Button from '../common/Button';

const AiSettingsModal = ({
    isOpen,
    onClose,
    settings,
    onSave,
    isSaving = false,
}) => {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gemini-3.1-flash-lite');

    useEffect(() => {
        if (isOpen) {
            setApiKey('');
            setModel(settings?.model || 'gemini-3.1-flash-lite');
        }
    }, [isOpen, settings?.model]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const saved = await onSave({ apiKey, model, provider: 'gemini' });
        if (saved) {
            setApiKey('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Settings">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-start gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                    <FaBrain className="text-violet-400 mt-0.5 shrink-0" size={16} />
                    <div>
                        <p className="text-sm text-gray-200 font-medium">Bring your own API key</p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Your key is encrypted and stored securely. It is only used server-side
                            for your AI resume checks and never exposed to the browser after saving.
                        </p>
                    </div>
                </div>

                {settings?.configured && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300">
                        Key saved{settings.keyHint ? ` (${settings.keyHint})` : ''} · {settings.model}
                    </div>
                )}

                <div>
                    <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-200 mb-1">
                        Gemini API key
                    </label>
                    <div className="relative">
                        <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                        <input
                            id="gemini-api-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={settings?.configured ? 'Leave blank to keep current key' : 'AIza…'}
                            className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            autoComplete="off"
                            required={!settings?.configured}
                        />
                    </div>
                    <a
                        href="https://aistudio.google.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-violet-400 hover:text-violet-300"
                    >
                        Get a free Gemini key
                        <FaExternalLinkAlt size={10} />
                    </a>
                </div>

                <div>
                    <label htmlFor="gemini-model" className="block text-sm font-medium text-gray-200 mb-1">
                        Model
                    </label>
                    <select
                        id="gemini-model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (lowest cost)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                    </select>
                    <p className="mt-1.5 text-xs text-gray-500">
                        Use Flash Lite for resume checks — it uses the least quota per run.
                    </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSaving || (!apiKey && !settings?.configured)}>
                        {isSaving ? 'Saving…' : settings?.configured ? 'Save settings' : 'Save key'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AiSettingsModal;
