from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):

    @abstractmethod
    def generate(self, prompt: str) -> str:
        pass

class MockLLMProvider(BaseLLMProvider):

    def generate(self, prompt: str) -> str:

        return """
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