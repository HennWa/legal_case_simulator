from abc import ABC, abstractmethod
from openai import OpenAI
from object_graph_runtime.graph_classes import LegalBranchNode


class BaseLLMProvider(ABC):

    @abstractmethod
    def generate(self, prompt: dict[str, str]) -> LegalBranchNode:
        pass

class MockLLMProvider(BaseLLMProvider):

    def __init__(self, key: str, model: str = "gpt-4.1-mini"):
        self.openai = OpenAI(api_key=key)
        self.model = model


    def generate(self, prompt_messages: dict[str, str]) -> LegalBranchNode:

        response = self.openai.responses.parse(
            model=self.model,
            input=[
                {"role": "system", "content": prompt_messages['system_prompt']},
                {"role": "user", "content": prompt_messages['user_prompt']}
            ],
            text_format=LegalBranchNode
        )

        result: LegalBranchNode = response.output_parsed

        return result