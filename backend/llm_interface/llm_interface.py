from abc import ABC, abstractmethod

from openai import OpenAI

from backend.object_graph_runtime.graph_classes import (
    LegalNode,
    LegalBranchNode,
    ArtifactCollection,
    PossibleActions,
)


class BaseLLMProvider(ABC):

    @abstractmethod
    def generate(
        self,
        prompt: dict[str, str],
    ) -> LegalBranchNode:
        pass

    @abstractmethod
    def generate_node(
        self,
        prompt: dict[str, str],
    ) -> LegalNode:
        pass

    @abstractmethod
    def generate_artifacts(
        self,
        prompt: dict[str, str],
    ) -> ArtifactCollection:
        pass

    @abstractmethod
    def generate_possible_actions(
        self,
        prompt: dict[str, str],
    ) -> PossibleActions:
        pass


class MockLLMProvider(BaseLLMProvider):

    def __init__(
        self,
        key: str,
        model: str = "gpt-4.1-mini",
    ):
        self.openai = OpenAI(
            api_key=key
        )

        self.model = model

    def generate(
        self,
        prompt_messages: dict[str, str],
    ) -> LegalBranchNode:

        response = self.openai.responses.parse(
            model=self.model,
            input=[
                {
                    "role": "system",
                    "content": (
                        prompt_messages[
                            "system_prompt"
                        ]
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt_messages[
                            "user_prompt"
                        ]
                    ),
                },
            ],
            text_format=LegalBranchNode,
        )

        result: LegalBranchNode = (
            response.output_parsed
        )

        return result

    def generate_node(
        self,
        prompt_messages: dict[str, str],
    ) -> LegalNode:

        response = self.openai.responses.parse(
            model=self.model,
            input=[
                {
                    "role": "system",
                    "content": (
                        prompt_messages[
                            "system_prompt"
                        ]
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt_messages[
                            "user_prompt"
                        ]
                    ),
                },
            ],
            text_format=LegalNode,
        )

        result: LegalNode = (
            response.output_parsed
        )

        return result

    def generate_artifacts(
        self,
        prompt_messages: dict[str, str],
    ) -> ArtifactCollection:

        response = self.openai.responses.parse(
            model=self.model,
            input=[
                {
                    "role": "system",
                    "content": (
                        prompt_messages[
                            "system_prompt"
                        ]
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt_messages[
                            "user_prompt"
                        ]
                    ),
                },
            ],
            text_format=ArtifactCollection,
        )

        result: ArtifactCollection = (
            response.output_parsed
        )

        return result

    def generate_possible_actions(
        self,
        prompt_messages: dict[str, str],
    ) -> PossibleActions:

        response = self.openai.responses.parse(
            model=self.model,
            input=[
                {
                    "role": "system",
                    "content": (
                        prompt_messages[
                            "system_prompt"
                        ]
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt_messages[
                            "user_prompt"
                        ]
                    ),
                },
            ],
            text_format=PossibleActions,
        )

        result: PossibleActions = (
            response.output_parsed
        )

        return result


class LegalLLMProvider(BaseLLMProvider):
    """
    LLM provider for legal research and legal analysis.

    Compared with MockLLMProvider, this provider:

    - can use a stronger dedicated model
    - enables OpenAI web search
    - uses a larger web-search context
    - otherwise preserves the same provider interface

    This makes it possible to use LegalLLMProvider only inside the
    legal-check workflow without changing the rest of the application.
    """

    def __init__(
        self,
        key: str,
        model: str = "gpt-5",
        search_context_size: str = "high",
    ):
        self.openai = OpenAI(
            api_key=key
        )

        self.model = model

        self.search_context_size = (
            search_context_size
        )

    def _web_search_tools(
        self,
    ) -> list[dict]:
        """
        Return the tools available to the legal research model.

        Web search is deliberately enabled only in LegalLLMProvider.
        """

        return [
            {
                "type": "web_search",
                "search_context_size": (
                    self.search_context_size
                ),
            }
        ]

    def generate(
        self,
        prompt_messages: dict[str, str],
    ) -> LegalBranchNode:
        """
        Generate a legally researched LegalBranchNode.

        The prompt remains responsible for defining the legal research
        task. This provider is responsible only for model/tool access
        and structured output.
        """

        response = self.openai.responses.parse(
            model=self.model,
            tools=self._web_search_tools(),
            input=[
                {
                    "role": "system",
                    "content": (
                        prompt_messages[
                            "system_prompt"
                        ]
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt_messages[
                            "user_prompt"
                        ]
                    ),
                },
            ],
            text_format=LegalBranchNode,
        )

        result: LegalBranchNode = (
            response.output_parsed
        )

        if result is None:
            raise RuntimeError(
                "Legal LLM returned no parsed "
                "LegalBranchNode."
            )

        return result

    def generate_node(
        self,
        prompt_messages: dict[str, str],
    ) -> LegalNode:
        """
        Generate a legally researched LegalNode.

        Used for legal analysis of initial/root states.
        """

        response = self.openai.responses.parse(
            model=self.model,
            tools=self._web_search_tools(),
            input=[
                {
                    "role": "system",
                    "content": (
                        prompt_messages[
                            "system_prompt"
                        ]
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt_messages[
                            "user_prompt"
                        ]
                    ),
                },
            ],
            text_format=LegalNode,
        )

        result: LegalNode = (
            response.output_parsed
        )

        if result is None:
            raise RuntimeError(
                "Legal LLM returned no parsed "
                "LegalNode."
            )

        return result

    def generate_artifacts(
        self,
        prompt_messages: dict[str, str],
    ) -> ArtifactCollection:
        """
        Implemented to satisfy BaseLLMProvider.

        LegalLLMProvider is currently intended only for legal-check
        operations. Artifact generation should continue using the normal
        provider.
        """

        response = self.openai.responses.parse(
            model=self.model,
            input=[
                {
                    "role": "system",
                    "content": (
                        prompt_messages[
                            "system_prompt"
                        ]
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt_messages[
                            "user_prompt"
                        ]
                    ),
                },
            ],
            text_format=ArtifactCollection,
        )

        result: ArtifactCollection = (
            response.output_parsed
        )

        return result

    def generate_possible_actions(
        self,
        prompt_messages: dict[str, str],
    ) -> PossibleActions:
        """
        Implemented to satisfy BaseLLMProvider.

        Possible-action generation should normally continue using the
        fast provider.
        """

        response = self.openai.responses.parse(
            model=self.model,
            input=[
                {
                    "role": "system",
                    "content": (
                        prompt_messages[
                            "system_prompt"
                        ]
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        prompt_messages[
                            "user_prompt"
                        ]
                    ),
                },
            ],
            text_format=PossibleActions,
        )

        result: PossibleActions = (
            response.output_parsed
        )

        return result