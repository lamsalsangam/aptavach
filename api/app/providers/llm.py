"""LLM provider factory. The rest of the app depends on this interface, not on any specific
vendor, so swapping Ollama for a cloud model is a change confined to this one file."""
from llama_index.core.llms import LLM

from ..config import Settings


def build_llm(settings: Settings) -> LLM:
    provider = settings.llm_provider.lower()

    if provider == "ollama":
        from llama_index.llms.ollama import Ollama

        return Ollama(
            model=settings.llm_model,
            base_url=settings.ollama_base_url,
            request_timeout=settings.request_timeout,
            context_window=settings.context_window,
        )

    # --- swap point --------------------------------------------------------------
    # Add cloud providers here; nothing else in the codebase needs to change.
    # if provider == "openai":
    #     from llama_index.llms.openai import OpenAI
    #     return OpenAI(model=settings.llm_model, api_key=settings.llm_api_key)
    # -----------------------------------------------------------------------------

    raise ValueError(f"Unsupported APTAVACH_LLM_PROVIDER: {settings.llm_provider!r}")
