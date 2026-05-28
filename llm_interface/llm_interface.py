from abc import ABC, abstractmethod
from openai import OpenAI
from object_graph_runtime.graph_classes import LegalBranches


class BaseLLMProvider(ABC):

    @abstractmethod
    def generate(self, prompt: dict[str, str]) -> LegalBranches:
        pass

class MockLLMProvider(BaseLLMProvider):

    def __init__(self, key: str, model: str = "gpt-4.1-mini"):
        self.openai = OpenAI(api_key=key)
        self.model = model


    def generate(self, prompt_messages: dict[str, str]) -> LegalBranches:

        response = self.openai.responses.parse(
            model=self.model,
            input=[
                {"role": "system", "content": prompt_messages['system_prompt']},
                {"role": "user", "content": prompt_messages['user_prompt']}
            ],
            text_format=LegalBranches
        )

        result: LegalBranches = response.output_parsed


        response2 ="""
        {
          "transitions": [
            {
              "action_type": "pay_invoice",
              "probability": 0.4,

              "next_state": {
                "paid": true,
                "invoice_amount": 5000
              },

              "summary": "Debtor pays the invoice.",

              "artifacts": [
                {
                  "type": "payment_confirmation",
                  "content": "Payment of 5000 EUR received."
                }
              ]
            },

            {
              "action_type": "ignore_reminder",
              "probability": 0.6,

              "next_state": {
                "paid": false,
                "reminder_ignored": true
              },

              "summary": "Debtor ignores reminder.",

              "artifacts": []
            }
          ]
        }
        """

        return result