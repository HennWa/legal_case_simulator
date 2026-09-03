import {
  createPortal,
} from "react-dom";


export default function NodeLimitModal({
  open,
  onClose,
  usage,
}) {
  if (!open) {
    return null;
  }


  const nodesCreated =
    usage?.nodes_created ?? 0;

  const nodeLimit =
    usage?.node_limit ?? null;


  return createPortal(
    <div
      role="presentation"

      style={{
        position:
          "fixed",

        inset:
          0,

        zIndex:
          10000,

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          24,

        background:
          "rgba(10, 6, 8, 0.72)",

        backdropFilter:
          "blur(4px)",
      }}

      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"

        aria-modal="true"

        aria-labelledby={
          "node-limit-title"
        }

        style={{
          width:
            "min(440px, 100%)",

          padding:
            "26px 28px 24px",

          boxSizing:
            "border-box",

          background:
            "linear-gradient(180deg, #25191e 0%, #1b1216 100%)",

          border:
            "1px solid rgba(192,132,151,0.42)",

          borderRadius:
            14,

          boxShadow:
            "0 24px 70px rgba(0,0,0,0.55)",

          color:
            "#f4ecee",
        }}
      >
        <div
          style={{
            width:
              42,

            height:
              42,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            marginBottom:
              18,

            borderRadius:
              10,

            background:
              "rgba(192,132,151,0.14)",

            border:
              "1px solid rgba(192,132,151,0.32)",

            color:
              "#d99caf",

            fontSize:
              21,

            fontWeight:
              700,
          }}
        >
          !
        </div>


        <h2
          id="node-limit-title"

          style={{
            margin:
              0,

            color:
              "#f6e7ec",

            fontSize:
              21,

            fontWeight:
              650,

            lineHeight:
              1.25,
          }}
        >
          Node limit reached
        </h2>


        <p
          style={{
            margin:
              "12px 0 0",

            color:
              "rgba(244,236,238,0.68)",

            fontSize:
              13,

            lineHeight:
              1.65,
          }}
        >
          You have reached the maximum number
          of nodes available for your current
          Casendra access.
        </p>


        {
          nodeLimit !== null &&
          (
            <div
              style={{
                marginTop:
                  20,

                padding:
                  "14px 16px",

                borderRadius:
                  9,

                background:
                  "rgba(192,132,151,0.08)",

                border:
                  "1px solid rgba(192,132,151,0.18)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "baseline",

                  justifyContent:
                    "space-between",

                  gap:
                    12,
                }}
              >
                <span
                  style={{
                    color:
                      "rgba(244,236,238,0.55)",

                    fontSize:
                      12,
                  }}
                >
                  Node usage
                </span>


                <span
                  style={{
                    color:
                      "#f3dce4",

                    fontSize:
                      13,

                    fontWeight:
                      650,
                  }}
                >
                  {
                    nodesCreated
                  } of {
                    nodeLimit
                  }
                </span>
              </div>


              <div
                style={{
                  width:
                    "100%",

                  height:
                    5,

                  marginTop:
                    10,

                  overflow:
                    "hidden",

                  borderRadius:
                    999,

                  background:
                    "rgba(192,132,151,0.14)",
                }}
              >
                <div
                  style={{
                    width:
                      "100%",

                    height:
                      "100%",

                    borderRadius:
                      999,

                    background:
                      "#c08497",
                  }}
                />
              </div>
            </div>
          )
        }


        <div
          style={{
            display:
              "flex",

            justifyContent:
              "flex-end",

            marginTop:
              24,
          }}
        >
          <button
            type="button"

            autoFocus

            onClick={
              onClose
            }

            style={{
              minWidth:
                90,

              padding:
                "9px 16px",

              border:
                "1px solid rgba(192,132,151,0.45)",

              borderRadius:
                8,

              background:
                "rgba(192,132,151,0.16)",

              color:
                "#f6e7ec",

              fontFamily:
                "inherit",

              fontSize:
                13,

              fontWeight:
                600,

              cursor:
                "pointer",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>,

    document.body
  );
}